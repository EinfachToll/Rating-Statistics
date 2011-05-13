#!/usr/bin/python2
# -*- coding: utf-8 -*-
# Copyright (c) 2010 Sebastian Wiesner <lunaryorn@googlemail.com>

# This program is free software; you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation; either version 2 of the License, or
# (at your option) any later version.

# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.

# You should have received a copy of the GNU General Public License
# along with this program; if not, write to the Free Software
# Foundation, Inc., 59 Temple Place - Suite 330,
# Boston, MA 02111-1307, USA.


"""
    export_amarok_covers
    ====================

    A script to export covers from the amarok cover database to the
    corresponding album directories.  Usage is quite simple, just execute
    the script::

       python export_amarok_covers

    It can create desktop entries for covers to set the cover image as
    directory icons::

       python export_amarok_covers -e

    Use :option:`--help` to get an overview of available options.

    .. note::

       As of now, the script does *not* work with Amarok's embedded MySQL
       database, but only, if Amarok is configured to use an external
       database.

    .. moduleauthor::  Sebastian Wiesner  <lunaryorn@googlemail.com>
"""


from __future__ import (print_function, division, unicode_literals,
                        absolute_import)


__version__ = '2.4'


import os
import sys
import time
import logging
import shutil
import errno
from datetime import datetime
from StringIO import StringIO
from subprocess import check_output, Popen, PIPE, CalledProcessError
from argparse import ArgumentParser
from contextlib import closing

from lxml import etree
from sqlalchemy import (MetaData, Table, Column, Integer, String,
                        ForeignKey, create_engine, select)
from sqlalchemy.sql.functions import coalesce
from sqlalchemy.engine.url import URL

# find an image module
try:
    from Image import open as pil_open
    HAVE_PIL = True
except ImportError:
    HAVE_PIL = False

# try to import mutagen
try:
    import mutagen
    from mutagen.id3 import APIC
    HAVE_MUTAGEN = True
except ImportError:
    HAVE_MUTAGEN = False

try:
    import sip
    sip.setapi('QVariant', 2)
    sip.setapi('QString', 2)
    from PyKDE4 import kdecore
    HAVE_PYKDE4 = True
except ImportError:
    HAVE_PYKDE4 = False


def _log_check_call(logger, command, stdin=None):
    """
    Call the ``command``, and return its standard output as :class:`unicode`
    object.  The invocation of ``command`` is logged to the given ``logger``
    at DEBUG level.

    If ``stdin`` is not ``None``, it is send as string to the standard input
    of the command.

    Raise :exc:`OSError`, if the command does not exist, or could not be
    executed for whatever reason, or :exc:`subprocess.CalledProcessError`,
    if the command did not return exit code 0.
    """
    logger.debug('calling %r', command)
    if stdin is None:
        output = check_output(command)
    else:
        process = Popen(command, stdin=PIPE, stdout=PIPE)
        output = process.communicate(stdin)[0]
        returncode = process.poll()
        if returncode != 0:
            raise CalledProcessError(returncode, command,
                                     output=output)
    return output.decode(sys.getfilesystemencoding()).strip()


def kde4_config_locate(type, filename):
    """
    Locate a resource of given ``type`` in the KDE directories.
    ``filename`` is the relative filename of the resource.  Return the
    absolute path of the resource, or ``None``, if the resource was not
    found.

    This function uses :command:`kde4-config` to locate resources.  Thus it
    will raise :exc:`OSError`, if the command does not exist, or could not
    be executed for whatever reason.  Moreover it will raise
    :exc:`subprocess.CalledProcessError`, if the command did not return exit
    code 0.
    """
    log = logging.getLogger('kde4.resources.kde4-config')
    log.debug('searching %s of type %s', filename, type)
    cmd = ['kde4-config', '--path', type, '--locate', filename]
    path = _log_check_call(log, cmd)
    if path:
        log.debug('found %s of type %s at %s', filename, type, path)
    return path or None


def kde4_kglobal_locate(type, filename):
    """
    Locate a resource of given ``type`` in the KDE directories.
    ``filename`` is the relative filename of the resource.  Return the
    absolute path of the resource, or ``None``, if the resource was not
    found.
    """
    log = logging.getLogger('kde4.resources.kstandarddirs')
    log.debug('searching %s of type %s', filename, type)
    path = kdecore.KStandardDirs.locate(type, filename)
    if path:
        log.debug('found %s of type %s at %s', filename, type, path)
    return path or None


if HAVE_PYKDE4:
    kde4_locate = kde4_kglobal_locate
else:
    kde4_locate = kde4_config_locate


class ConfigBase(object):
    def __enter__(self):
        return self

    def __exit__(self, *_):
        self.close()


class ProcessKDE4ConfigFile(ConfigBase):
    """
    A KDE4 config file object, which reads and writes settings through
    ``kreadconfig`` and ``kwriteconfig`` respectively.
    """

    log = logging.getLogger('kde4.config.process')

    def __init__(self, filename):
        """
        Open the configuration file denoted by ``filename``.
        """
        self.filename = filename

    def close(self):
        pass

    def get(self, group, key, default=None):
        """
        Read the configuration value for ``key`` from ``group``.  If ``key``
        does not exist in ``group``, the ``default`` value is returned.  If
        no ``default`` is given, ``None`` is returned.  All arguments are
        strings.

        Return the value as string.
        """
        self.log.debug('reading %s from file %s, group %s, default %s',
                       key, self.filename, group, default)
        cmd = ['kreadconfig', '--file', self.filename, '--group', group,
               '--key', key]
        if default is not None:
            cmd.append('--default')
            cmd.append(default)
        return _log_check_call(self.log, cmd) or None

    def set(self, group, key, value):
        """
        Write ``value`` for ``key`` in ``group``.  All argumenst are
        strings.
        """
        self.log.debug('setting %s to %s in file %s, group %s',
                       key, value, self.filename, group)
        cmd = ['kwriteconfig', '--file', self.filename, '--group', group,
               '--key', key, value]
        _log_check_call(self.log, cmd)


class PyKDE4ConfigFile(ConfigBase):
    """
    A KDE4 config file object, which reads and writes settings through
    ``PyKDE4.kdecore.KConfig``.
    """

    log = logging.getLogger('kde4.config.kconfig')

    def __init__(self, filename):
        """
        Open the configuration file denoted by ``filename``.
        """
        self.filename = filename
        self._config = kdecore.KConfig(
            self.filename, kdecore.KConfig.SimpleConfig)

    def close(self):
        self._config.sync()

    def get(self, group, key, default=None):
        """
        Read the configuration value for ``key`` from ``group``.  If ``key``
        does not exist in ``group``, the ``default`` value is returned.  If
        no ``default`` is given, ``None`` is returned.  All arguments are
        strings.

        Return the value as string.
        """
        self.log.debug('reading %s from file %s, group %s, default %s',
                       key, self.filename, group, default)
        return self._config.group(group).readEntryUntranslated(
            key, default or '')


    def set(self, group, key, value):
        """
        Write ``value`` for ``key`` in ``group``.  All argumenst are
        strings.
        """
        self.log.debug('setting %s to %s in file %s, group %s',
                       key, value, self.filename, group)
        self._config.group(group).writeEntry(key, value)


if HAVE_PYKDE4:
    KDE4ConfigFile = PyKDE4ConfigFile
else:
    KDE4ConfigFile = ProcessKDE4ConfigFile


# Scheme of Amarok database.  This scheme is far from being complete, and
# only reflects the tables and columns, which are required by this script.
metadata = MetaData()
albums = Table('albums', metadata,
               Column('id', Integer, primary_key=True),
               Column('name', String),
               Column('image', None, ForeignKey('images.id')))
images = Table('images', metadata,
               Column('id', Integer, primary_key=True),
               Column('path', String(255)))
tracks = Table('tracks', metadata,
               Column('id', Integer, primary_key=True),
               Column('url', None, ForeignKey('urls.id')),
               Column('album', None, ForeignKey('albums.id')))
urls = Table('urls', metadata,
             Column('id', Integer, primary_key=True),
             Column('deviceid', ForeignKey('devices.id')),
             Column('directory', None, ForeignKey('directories.id')),
             Column('rpath', String),
             Column('uniqueid', String))
directories = Table('directories', metadata,
                    Column('id', Integer, primary_key=True),
                    Column('deviceid', None, ForeignKey('devices.id')),
                    Column('dir', String))
devices = Table('devices', metadata,
                Column('id', Integer, primary_key=True),
                Column('lastmountpoint', String))


class PILImage(object):
    @classmethod
    def fromfile(cls, filename):
        image = cls()
        image.filename = filename
        image._image = pil_open(filename)
        return image

    @classmethod
    def fromdata(cls, data):
        image = cls()
        image.filename = None
        image._image = pil_open(StringIO(data))
        return image

    @property
    def format(self):
        return self._image.format.lower()

    def save(self, destination):
        self._image.save(destination)


class ImageMagickImage(object):
    log = logging.getLogger('amarok.covers.imagemagick')

    @classmethod
    def fromfile(cls, filename):
        image = cls()
        image.filename = filename
        image.data = None
        return image

    @classmethod
    def fromdata(cls, data):
        image = cls()
        image.filename = None
        image.data = data
        return image

    @property
    def format(self):
        if self.filename:
            identification = _log_check_call(
                self.log, ['identify', self.filename])
        else:
            identification = _log_check_call(
                self.log, ['identify', '-'], stdin=self.data)
        return identification.rsplit(' ', 8)[1].lower()

    def save(self, destination):
        if self.filename:
            _log_check_call(
                self.log, ['convert', self.filename, destination])
        else:
            _log_check_call(
                self.log, ['convert', '-', destination], stdin=self.data)


if HAVE_PIL:
    Image = PILImage
else:
    Image = ImageMagickImage


def create_desktop_entry(album, directory, cover_file):
    """
    Create a `desktop entry`_ specifying the cover file as directory icon in
    the album directory.  Given such a desktop entry, file managers
    compliant to the Desktop File Specification will use the cover file as
    folder icon.

    ``album`` is the album, the cover belongs to.  The desktop entry will be
    created for ``directory``, using the given ``cover_file``.  If
    ``cover_file`` is located inside ``directory``, it is linked using the
    relative path, thus preserving the folder icon on folder renames or
    copies.
    """
    if not os.path.exists(cover_file):
        return

    log = logging.getLogger('amarok.covers')
    if cover_file.startswith(directory):
        # turn into relative path
        cover_file = os.path.join(
            os.curdir, os.path.relpath(cover_file, directory))
    log.info('creating desktop entry for %s in %s', album, directory)
    with KDE4ConfigFile(os.path.join(directory, '.directory')) as entry:
        entry.set('Desktop Entry', 'Icon', cover_file)



def export_cover(album, cover, directory, cover_name):
    """
    Export a ``cover`` to a ``directory`` using the given ``cover_name`` and
    return the path to the exported cover file.

    ``album`` is the name of the album, the ``cover`` belongs to.  ``cover``
    is an :class:`Image` object representing the cover file.
	print cover_tag

    This cover will be exported to the given ``directory`` using the given
    ``cover_name``.  If ``cover_name`` includes an extension, the cover will
    be converted to the image format denoted by the extension.  For
    instance, the following line will export all covers in PNG format::

       export_cover(album, cover,  directory, 'cover.png')

    If ``cover_name`` does not include an extension, the extension will be
    chosen according to the image format of ``cover`` (which is most
    likely JPEG).  In this case, ``cover`` is simply copied, to avoid
    potential quality loss due to repeated compression.

    Return the path to the exported cover.
    """
    log = logging.getLogger('amarok.covers')
    cover_ext = os.extsep + cover.format
    dest, dest_ext = os.path.splitext(os.path.normpath(
        os.path.join(directory, cover_name)))
    if not dest_ext:
        dest_ext = cover_ext
    dest += dest_ext
    if cover.filename and os.path.normpath(cover.filename) == dest:
        # old and new covers are the same, no action required
        return dest
    else:
        log.info('exporting cover of %s to %s', album, dest)
        if dest_ext != cover_ext or not cover.filename:
            # conversion required
            cover.save(dest)
        else:
            # perform simple copy, if formats are the same, avoids quality
            # loss due to repeated compression
            shutil.copyfile(cover.filename, dest)
        return dest


class NoCoverError(Exception):
    pass


def extract_cover_from_track(album, track):
    """
    Extract the cover for ``album`` from the metadata of the given
    ``track``.

    ``album`` is a string with the album name, ``track`` a string with the
    filename of the track.

    Return a tuple ``(cover_timestamp, cover_image)``, where
    ``cover_timestamp`` is a float containing the modification time of the
    cover (as in ``os.path.getmtime()``), and ``cover_image`` an ``Image``
    object containing the cover.
    """
    log = logging.getLogger('amarok.covers')
    log.debug('extracting cover for %s from track %s', album, track)
    cover_timestamp = os.path.getmtime(track)
    metadata = mutagen.File(track)
    apic_tags = [t for t in metadata.values() if isinstance(t, APIC)]
    # ID3 standard defines 3 as type constant for album front cover in APIC
    # tag
    front_covers = [t for t in apic_tags if t.type == 3]
    # 0 is a type constant for an "other" image, sometimes the front cover
    # is incorrectly stored under this type
    other_images = [t for t in apic_tags if t.type == 0]
    # try to find a suitable image in the tag
    if front_covers:
        cover_tag = front_covers[0]
    elif other_images:
        cover_tag = other_images[0]
    elif apic_tags:
        cover_tag = apic_tags[0]
    else:
        raise NoCoverError('track {0} has no embedded cover'.format(track))
    return cover_timestamp, Image.fromdata(cover_tag.data)


if not HAVE_MUTAGEN:
    # dummy in case of missing mutagen
    def extract_cover_from_track(album, _):
        raise NoCoverError('album {0} has embedded cover.  Install mutagen '
                           'to export embedded covers'.format(album))


def load_album_cover(connection, album, cover_url):
    """
    Load the cover of ``album`` from ``cover_url``.  ``connection`` is an
    SQLAlchemy connection, from which additional information is fetched, if
    necessary.

    Return a tuple ``(cover_timestamp, cover_image)``, where
    ``cover_timestamp`` is a float containing the modification time of the
    cover (as in ``os.path.getmtime()``), and ``cover_image`` an ``Image``
    object containing the cover.
    """
    if cover_url.startswith('amarok-sqltrackuid://'):
        select_track_by_id = select(
            [coalesce(devices.c.lastmountpoint, '/').label('mount'),
             urls.c.rpath], urls.c.uniqueid==cover_url,
            from_obj=urls.outerjoin(devices))
        with closing(connection.execute(select_track_by_id)) as result:
            mount_point, track = result.fetchone()
            track = os.path.normpath(os.path.join(mount_point, track))
            return extract_cover_from_track(album, track)
    else:
        return os.path.getmtime(cover_url), Image.fromfile(cover_url)


def find_album_covers(connection):
    """
    Find all covers registered in the amarok database.

    ``connection`` is a SQLAlchemy connection to the Amarok database.  This
    function queries the database to find all covers, that need to be
    exported.

    Yield ``(album, cover_url, directory)``, where ``album`` is a string
    with the album name, ``cover_url`` is a string with the url of the album
    cover, and ``directory`` is the directory, in which the album is stored
    on disk.
    """
    log = logging.getLogger('amarok.covers')
    joined = albums.join(images).join(tracks).join(urls).join(
        directories).outerjoin(devices)
    select_covers = select(
        [albums.c.name.label('album'), images.c.path.label('image_file'),
         coalesce(devices.c.lastmountpoint, '/').label('mount'),
         directories.c.dir.label('directory')],
        from_obj=joined).distinct()
    with closing(connection.execute(select_covers)) as result:
        for row in result:
            try:
                log.debug('fetched %(album)r, %(image_file)r, '
                          '%(directory)r, %(mount)r', dict(row))
                album_directory = os.path.normpath(
                    os.path.join(row['mount'], row['directory']))
                yield row['album'], row['image_file'], album_directory
            except UnicodeDecodeError:
                log.exception(
                    'unexpected non-UTF-8 data found, cover skipped')


def _find_mysql_connector():
    """
    Try to find a working MySQL connector.  Supports OurSQL and MySQLdb as
    of now.

    Return a string with a valid SQLAlchemy URL scheme, or ``None``, if no
    provider was found.
    """
    try:
        import oursql
        return 'mysql+oursql'
    except ImportError:
        pass

    try:
        import MySQLdb
        return 'mysql'
    except ImportError:
        pass


def url_from_config(sql_config):
    """
    Create a :class:`~sqlalchemy.engine.url.URL` object representing the
    given database configuration.  This url can be used to connect to the
    database.
    """
    config_map = {'Database': b'database',
                  'Host': b'host', 'Port': b'port',
                  'User': b'username', 'Password': b'password'}
    scheme = _find_mysql_connector()
    if not scheme:
        raise ImportError('No MySQL connector installed.  Please install '
                          'either OurSQL or MySQLdb')
    url = URL(scheme)
    for config_key, url_attr in config_map.iteritems():
        setattr(url, url_attr, sql_config[config_key])

    debug_password = 'XXXXX' if url.password else None
    debug_url = URL(url.drivername, url.username, debug_password,
                    url.host, url.port, url.database)
    logging.getLogger('amarok.database').debug('connecting to %s', debug_url)
    return url


def _bool(value):
    """
    Return the boolean corresponding to ``value``.

    Raise :exc:`ValueError`, if ``value`` is neither ``'true'`` nor
    ``'false'``.
    """
    if isinstance(value, bool):
        return value
    if value not in ('true', 'false'):
        raise ValueError('invalid bool value: {0!r}'.format(value))
    return value == 'true'


def read_amarok_database_configuration():
    log = logging.getLogger('amarok.config')

    # configuration settings
    mysql = {}
    # maps type names from kcfg to conversion functions
    casts = {'Bool': _bool, 'Int': int, 'String': unicode}

    config_file = kde4_locate('config', 'amarokrc')
    log.debug('using configuration file at %s', config_file)
    schema_file = kde4_locate('kcfg', 'amarokconfig.kcfg')
    log.debug('using schema file at %s', schema_file)

    namespaces = {'kcfg': 'http://www.kde.org/standards/kcfg/1.0'}
    # XPath expression to read the default value of a configuration key
    get_default = etree.XPath('./kcfg:default/text()',
                              namespaces=namespaces)
    schema = etree.parse(schema_file).xpath(
        '//kcfg:group[@name="MySQL"]', namespaces=namespaces)[0]

    with KDE4ConfigFile(config_file) as config:
        for entry in schema.xpath('./kcfg:entry', namespaces=namespaces):
            key = entry.get('key')
            typename = entry.get('type')
            try:
                default = get_default(entry)[0]
            except IndexError:
                default = None
            log.debug('reading %s with type %s, default %s from database '
                      'configuration', key, typename, default)
            mysql[key] = casts[typename](
                config.get('MySQL', key, default=default))

    return mysql


class color(object):
    COLORS = {'darkred': '\x1b[31m',
              'darkgreen': '\x1b[32m',
              'brown': '\x1b[33m',
              'purple': '\x1b[35m',
              'lightgray': '\x1b[37m'}
    RESET = '\x1b[39;49;00m'

    def __init__(self, value):
        self._value = value

    def __format__(self, color):
        return '{color}{value}{reset}'.format(
            color=self.__class__.COLORS[color], value=self._value,
            reset=self.__class__.RESET)

    def __getattr__(self, attr):
        v = self.__dict__['_value']
        if attr == '_value':
            return v
        else:
            return color(getattr(v, attr))


class ColorfulFormatter(object):
    """
    Format :class:`logging:LogRecord` objects with pretty ASCII colors for
    user-friendly output.

    Unlike :class:`logging.Formatter` the output format of this class cannot
    be configured as of now.

    See :var:`TEMPLATE` for the format of the emitted message.
    """

    #: the message template.  ``msgcolor`` is gray for debug messages and
    #  green otherwise
    TEMPLATE = ('{1.levelname:purple}:{1.name:brown}: '
                '{1.message:{msgcolor}}')

    def format(self, record):
        """
        Format the given ``record`` (a :class:`logging.LogRecord` instance)
        and return the log message as string.
        """
        params = vars(record)
        params['message'] = record.getMessage()
        msgcolor = 'darkgreen'
        if record.levelno >= logging.WARNING:
            msgcolor = 'darkred'
        elif record.levelno <= logging.DEBUG:
            msgcolor = 'lightgray'
        text = self.TEMPLATE.format(self, color(record), msgcolor=msgcolor)
        if record.exc_info:
            from traceback import format_exception
            exc_text = ''.join(format_exception(*record.exc_info))
            text += '\n' + '{0:darkred}'.format(color(exc_text))
        return text


def _setup_logging(opts):
    logging.getLogger().setLevel(logging.NOTSET)
    stdout = logging.StreamHandler(sys.stdout)
    stdout.setFormatter(ColorfulFormatter())
    stdout.setLevel(opts.level)
    logging.getLogger().addHandler(stdout)
    if opts.log_sql:
        logging.getLogger('sqlalchemy.engine').setLevel(logging.DEBUG)
        logging.getLogger('sqlalchemy.pool').setLevel(logging.DEBUG)
    if opts.logfile:
        logfile_handler = logging.FileHandler(opts.logfile, 'w', 'utf-8')
        logfile_handler.setLevel(logging.DEBUG)
        logfile_handler.setFormatter(logging.Formatter(
            '%(asctime)s %(levelname)-5.5s %(name)s: %(message)s',
            '%Y-%m-%dT%H:%M:%S'))
        logging.getLogger().addHandler(logfile_handler)


def find_data_directory(application):
    """
    Find the XDG data directory for the given ``application``.
    ``application`` is a string containing the applications name.
    """
    xdg_data_home = os.environ.get('XDG_DATA_HOME')
    if not xdg_data_home:
        xdg_data_home = os.path.expandvars(
            os.path.join('$HOME', '.local', 'share'))
    return os.path.join(xdg_data_home, application)


def ensure_directory_path(directory):
    """
    Ensure the existing of ``directory``.  ``directory`` and all its parents
    are created as necessary.
    """
    try:
        os.makedirs(directory)
    except OSError as error:
        if error.errno != errno.EEXIST:
            raise


def main():
    parser = ArgumentParser(
        epilog="""\
Copyright (C) 2010 Sebastian Wiesner <lunaryorn@googlemail.com>,
distributed under the terms of the GNU GPL 2 license""")
    arg = parser.add_argument
    arg('--version', action='version', version=__version__,
        help='Show program version')
    arg('--log-sql', action='store_true', help='Enable SQL debugging '
        'output. Needs option -d or --logfile.  Very chatty')
    arg('-d', '--debug', help='Enable debugging output.  Chatty',
        action='store_const', const=logging.DEBUG, dest='level')
    arg('-v', '--verbose', help='Enable informative output',
        action='store_const', const=logging.INFO, dest='level')
    arg('--logfile', help='Log all output to the given FILE.  FILE will '
        'always contain all debugging output, independent of option -d.',
        metavar='FILE')
    arg('-n', '--cover-name', help='The cover name.  If you specify an '
        'extension, the cover is converted into the format denoted by the '
        'extension.  Otherwise the format is guessed from the original '
        'cover, and the extension is chosen appropriately.  '
        'Defaults to "cover.png"')
    arg('-e', '--desktop-entries', help='Create desktop entries for '
        'exported covers.  Compatible file managers will use the cover as '
        'folder icon, if desktop entries are created', action='store_true')
    arg('-f', '--force', help='Forcibly export all covers, even if a cover '
        'has already been exported', action='store_true')
    parser.set_defaults(level=logging.WARNING, cover_name='cover.png')
    args = parser.parse_args()

    _setup_logging(args)

    # log version for debugging purposes
    import sqlalchemy
    log = logging.getLogger('amarok.covers.export')
    log.debug('export_amarok_covers %s with SQLAlchemy %s',
              __version__, sqlalchemy.__version__)

    try:
        data_directory = find_data_directory('export_amarok_covers')
        ensure_directory_path(data_directory)

        # read the timestamp of the last cover export
        last_export_file = os.path.join(data_directory, 'last_export')
        if args.force:
            log.debug('export of all covers forced, ignoring last export '
                      'time')
            last_export_time = 0
        else:
            log.debug('loading last export timestamp from %s',
                      last_export_file)
            try:
                with open(last_export_file) as stream:
                    last_export_time = float(stream.read().strip())
            except (EnvironmentError, IndexError) as _:
                last_export_time = 0

        if last_export_time == 0:
            log.info('exporting all covers')
        else:
            log.info('exporting all covers changed since %s',
                     datetime.fromtimestamp(last_export_time))

        # read amarok's MySQL connection settings
        sql_config = read_amarok_database_configuration()
        if not sql_config['UseServer']:
            logging.getLogger('amarok.database').critical(
                'amarok not configured for external database')
            return

        engine = create_engine(url_from_config(sql_config),
                               convert_unicode=True)
        for album, cover_url, directory in find_album_covers(engine):
            try:
                cover_timestamp, cover = load_album_cover(engine, album,
                                                          cover_url)
                if cover_timestamp > last_export_time:
                    cover_file = export_cover(
                        album, cover, directory, args.cover_name)
                    if args.desktop_entries:
                        create_desktop_entry(album, directory, cover_file)
                else:
                    log.debug('skipping cover %s of %s, already exported',
                              cover_url, album)
            except NoCoverError as error:
                log.error('could not load cover %s of %s to %s: %s',
                          cover_url, album, directory, error)
            except (EnvironmentError, CalledProcessError) as error:
                log.exception(
                    'failure while exporting cover %s of %s to %s',
                    cover_url, album, directory)

        log.debug('writing last export timestamp to %s', last_export_file)
        with open(last_export_file, 'w') as stream:
            print(time.time(), file=stream)

    except ImportError as error:
        logging.error('missing dependencies: %s', error)
    except KeyboardInterrupt:
        logging.warn('interrupted')
    except Exception:
        logging.exception('unexpected error occurred, not all covers were '
                          'exported')
    finally:
        logging.shutdown()


if __name__ == '__main__':
    main()
