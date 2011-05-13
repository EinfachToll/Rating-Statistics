import os
import sys
import time
import logging
import shutil
import errno
from datetime import datetime
from StringIO import StringIO
from contextlib import closing

from lxml import etree
import Image

# find an image module
try:
    from Image import open as pil_open
    HAVE_PIL = True
except ImportError:
	print "nee"

# try to import mutagen
try:
    import mutagen
    from mutagen.id3 import APIC
    HAVE_MUTAGEN = True
except ImportError:
    HAVE_MUTAGEN = False

track="/home/toll/Musik/Mugge/Within Temptation - Mother Earth/12 - Within Temptation - Bittersweet.mp3"

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
	print cover_tag
else:
	raise NoCoverError('track {0} has no embedded cover'.format(track))

bild=ImageMagickImage.fromdata(cover_tag.data)
print bild
