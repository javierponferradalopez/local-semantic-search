#!/bin/sh
# fetch-images.sh -- get the four test images that the multimodal benchmark
# scripts read as images/img1.jpg through images/img4.jpg.
#
# bench.mjs, bench2.mjs, gap.mjs and mobile.mjs all read these files.
# The cosine numbers in multimodal.md section 6 come from these exact images.
# Do not put different images in their place. The report becomes wrong.
#
#   img1.jpg  two tabby cats on a pink blanket, with two TV remote controls
#   img2.jpg  the head of a brown bear, close up, on grass
#   img3.jpg  a bedroom with a blue bed, a bookcase and a sunlit window
#   img4.jpg  a stop sign at a road junction, installed upside down
#
# All four come from the COCO 2017 validation set.
# Run:  sh fetch-images.sh

set -eu

out=$(dirname "$0")/images
mkdir -p "$out"

# name  sha256  url
fetch() {
    if [ -f "$out/$1" ]; then
        echo "skip      $1"
        verify "$1" "$2"
        return 0
    fi
    echo "download  $1"
    if ! curl -fsSL -o "$out/$1.part" "$3"; then
        rm -f "$out/$1.part"
        echo "ERROR: download failed for $1 from $3" >&2
        exit 1
    fi
    mv "$out/$1.part" "$out/$1"
    verify "$1" "$2"
}

# Guards against a silent swap. Skipped if no checksum tool is installed.
verify() {
    if command -v shasum > /dev/null 2>&1; then
        got=$(shasum -a 256 "$out/$1" | cut -d' ' -f1)
    elif command -v sha256sum > /dev/null 2>&1; then
        got=$(sha256sum "$out/$1" | cut -d' ' -f1)
    else
        echo "          no checksum tool, $1 not verified" >&2
        return 0
    fi
    if [ "$got" != "$2" ]; then
        echo "ERROR: $1 is not the expected image." >&2
        echo "       expected $2" >&2
        echo "       got      $got" >&2
        echo "       Delete it and run this script again." >&2
        exit 1
    fi
}

fetch img1.jpg \
    dea9e7ef97386345f7cff32f9055da4982da5471c48d575146c796ab4563b04e \
    http://images.cocodataset.org/val2017/000000039769.jpg

fetch img2.jpg \
    f3a2974ce3686332609124c70e3e6a2e3aca43fccf1cd1bd7c5c03820977f57d \
    http://images.cocodataset.org/val2017/000000000285.jpg

fetch img3.jpg \
    a4cd7f45ac1ce27eaafb254b23af7c0b18a064be08870ceaaf03b2147f2ce550 \
    http://images.cocodataset.org/val2017/000000000632.jpg

fetch img4.jpg \
    5c0e559c75d3969c8e3e297b61f61063f78045c9d4802b526ba616361f3823fd \
    http://images.cocodataset.org/val2017/000000000724.jpg

echo "OK: four images in $out"
