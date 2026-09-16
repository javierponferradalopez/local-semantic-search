#!/bin/sh
# fetch-images.sh -- get the 16 test images that siglip-floor.mjs and
# siglip-calib.mjs read from images/.
#
# The cosine numbers in search-floor.md come from these exact images. Do not
# put different images in their place. The report becomes wrong.
#
# All 16 come from the COCO 2017 validation set. The first four are the same
# four that the earlier `research/multimodal` branch used.
#
#   000000039769  two tabby cats on a pink blanket, with two TV remote controls
#   000000000285  the head of a brown bear, close up, on grass
#   000000000632  a bedroom with a blue bed, a bookcase and a sunlit window
#   000000000724  a stop sign at a road junction, installed upside down
#   000000000776  three teddy bears together on a sofa
#   000000000785  a woman in a red jacket on skis, on a snow slope
#   000000000802  a kitchen with a white cooker and a white fridge
#   000000000872  two men on a baseball field, one running, one throwing
#   000000000885  a man who plays tennis on a hard court
#   000000001000  a group of children with tennis rackets and a trophy
#   000000001268  people beside a river under a bridge, with a swan
#   000000001353  children in a small red train ride, indoors
#   000000001296  a woman who looks at a white mobile telephone
#   000000001425  a bread roll on a white plate, black and white
#   000000001490  a man on a paddleboard on the sea, black and white
#   000000001503  a desktop computer and a laptop on a desk
#
# Run:  sh fetch-images.sh

set -eu

out=$(dirname "$0")/images
mkdir -p "$out"

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

# name  sha256
fetch() {
    if [ -f "$out/$1.jpg" ]; then
        echo "skip      $1"
        verify "$1.jpg" "$2"
        return 0
    fi
    echo "download  $1"
    if ! curl -fsSL -o "$out/$1.jpg.part" \
        "http://images.cocodataset.org/val2017/$1.jpg"; then
        rm -f "$out/$1.jpg.part"
        echo "ERROR: download failed for $1" >&2
        exit 1
    fi
    mv "$out/$1.jpg.part" "$out/$1.jpg"
    verify "$1.jpg" "$2"
}

fetch 000000039769 dea9e7ef97386345f7cff32f9055da4982da5471c48d575146c796ab4563b04e
fetch 000000000285 f3a2974ce3686332609124c70e3e6a2e3aca43fccf1cd1bd7c5c03820977f57d
fetch 000000000632 a4cd7f45ac1ce27eaafb254b23af7c0b18a064be08870ceaaf03b2147f2ce550
fetch 000000000724 5c0e559c75d3969c8e3e297b61f61063f78045c9d4802b526ba616361f3823fd
fetch 000000000776 1dd31e9059c491992be2f562624eb4093e17aee08b4f7baf5ff9ea24543b0a33
fetch 000000000785 83981537a7baeafbeb9c8cb67b3484dc26433f574b3685d021fa537e277e4726
fetch 000000000802 d5b79e7fa716f85ca86f46e5f518da9b6c5e26414925624d76e6476861aec495
fetch 000000000872 c2aa138ee3a59b057a7ba6fc5a6a18e62af531aa7dab78a7bfd33c1cd7e55eb6
fetch 000000000885 1c67b783f78b18ddb5dd20aaba4d4aacaf98e5277051688a96da096afa9cdf1f
fetch 000000001000 24bb77a31928404e45a0454b06f6a0bd54a8db103590c9d7917288a1e0269f05
fetch 000000001268 8e85a2e71ee512fe748a3a3be9bb40b8591e8c501c0f3896efcb5be5999ec236
fetch 000000001296 34a98da7c11bc8811e6eec445145bb16f3d5f4338945ba116edcc1fe554d181b
fetch 000000001353 1cccef217a1e5eec2acc74d7c08a105da3ef6fdb8514e221cdea9b0b373b60ea
fetch 000000001425 71a37c25cdf944cf0a88b66d00a66cf899a88bd55c7ac80fcf1c76329d617e6c
fetch 000000001490 a044804a0b0186a1267acae34975932f14ede96c4a2b78fcee74e6c2fbd8414d
fetch 000000001503 06c721f0a62bcb9fcb2d2d0cc0b9edd63092084a8773a18c4b5a7bd6fb4f095d

echo "OK: 16 images in $out"
