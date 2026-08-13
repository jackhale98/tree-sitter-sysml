#!/bin/sh
# Parse every example (recursively, spaces-in-names safe) and fail on any
# file with parse errors that is not in baselines/known-parse-errors.txt.
# A baselined file that starts parsing cleanly is reported so the baseline
# can be shrunk — improvements should be banked, not silently absorbed.
set -u
cd "$(dirname "$0")/.."

TS="${TREE_SITTER:-tree-sitter}"
BASELINE=baselines/known-parse-errors.txt
FAILED_LIST=$(mktemp)
trap 'rm -f "$FAILED_LIST"' EXIT

find test/examples -name "*.sysml" -print | sort | while IFS= read -r f; do
    if ! "$TS" parse "$f" --quiet >/dev/null 2>&1; then
        printf '%s\n' "$f" >> "$FAILED_LIST"
    fi
done

STATUS=0
while IFS= read -r f; do
    if grep -qxF "$f" "$BASELINE" 2>/dev/null; then
        echo "known-imperfect: $f"
    else
        echo "NEW PARSE FAILURE: $f"
        STATUS=1
    fi
done < "$FAILED_LIST"

# Baselined files that now parse cleanly.
if [ -f "$BASELINE" ]; then
    grep -v '^#' "$BASELINE" | grep -v '^[[:space:]]*$' | while IFS= read -r f; do
        if [ -f "$f" ] && ! grep -qxF "$f" "$FAILED_LIST"; then
            echo "IMPROVED (remove from baseline): $f"
        fi
    done
fi

# Parser-size metrics — watch these when changing the grammar.
if [ -f src/parser.c ]; then
    echo "--- metrics ---"
    grep -m1 '#define STATE_COUNT' src/parser.c
    grep -m1 '#define LARGE_STATE_COUNT' src/parser.c
    echo "parser.c bytes: $(wc -c < src/parser.c)"
fi

exit $STATUS
