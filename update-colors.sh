#!/bin/bash

# Script to update all teal/emerald colors to purple (#531B93) and blue (#2563EB)

cd /tmp/cc-agent/58980838/project/src

# Replace all teal/emerald gradients and colors with purple/blue theme
find . -name "*.tsx" -type f -exec sed -i \
  -e 's/from-emerald-500 to-teal-600/bg-[#2563EB]/g' \
  -e 's/from-teal-500 to-blue-600/from-[#531B93] to-[#2563EB]/g' \
  -e 's/from-blue-500 to-cyan-600/bg-[#531B93]/g' \
  -e 's/ring-teal-500/ring-[#531B93]/g' \
  -e 's/ring-emerald-500/ring-[#2563EB]/g' \
  -e 's/text-teal-600/text-[#531B93]/g' \
  -e 's/text-emerald-600/text-[#2563EB]/g' \
  -e 's/border-teal-500/border-[#531B93]/g' \
  -e 's/bg-teal-50/bg-blue-50/g' \
  -e 's/bg-teal-100/bg-blue-100/g' \
  -e 's/text-teal-700/text-[#2563EB]/g' \
  -e 's/hover:bg-teal-50/hover:bg-blue-50/g' \
  -e 's/hover:text-teal-600/hover:text-[#2563EB]/g' \
  -e 's/hover:text-teal-700/hover:text-[#2563EB]/g' \
  -e 's/hover:border-teal-300/hover:border-blue-300/g' \
  -e 's/border-teal-200/border-blue-200/g' \
  -e 's/bg-teal-500/bg-[#531B93]/g' \
  -e 's/hover:from-teal-600 hover:to-blue-700/hover:from-[#3d1470] hover:to-[#1d4ed8]/g' \
  -e 's/hover:from-emerald-600 hover:to-teal-700/hover:bg-[#1d4ed8]/g' \
  -e 's/text-teal-600/text-[#531B93]/g' \
  {} \;

echo "Color update complete!"
