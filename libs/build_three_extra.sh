#!/bin/bash

# builds three.extra.js
# should be executed inside three distribution package

tgt=three.extra.js

src=~/d/three.js-r127

rm -rf $tgt
touch $tgt

echo Producing $tgt from $src

cat ./three.extra_head.js >> $tgt
cat $src/examples/fonts/helvetiker_regular.typeface.json >> $tgt
echo "" >> $tgt
echo "   );" >> $tgt
echo "" >> $tgt

echo "// Content of examples/js/renderers/Projector.js" >> $tgt
cat  $src/examples/js/renderers/Projector.js >> $tgt
echo "" >> $tgt

# echo "// Content of examples/js/renderers/SoftwareRenderer.js" >> $tgt
# cat $src/examples/js/renderers/SoftwareRenderer.js >> $tgt
# echo "" >> $tgt

cat ./three.svg_renderer_header.js >> $tgt
cat $src/examples/js/renderers/SVGRenderer.js >> $tgt
cat ./three.svg_renderer_footer.js >> $tgt
echo "" >> $tgt

echo "// Content of examples/js/controls/OrbitControls.js" >> $tgt
cat  $src/examples/js/controls/OrbitControls.js >> $tgt
echo "" >> $tgt

echo "// Content of examples/js/controls/TransformControls.js" >> $tgt
cat $src/examples/js/controls/TransformControls.js >> $tgt
echo "" >> $tgt

echo "// Content of examples/js/shaders/CopyShader.js" >> $tgt
cat $src/examples/js/shaders/CopyShader.js >> $tgt
echo "" >> $tgt

echo "// Content of examples/js/postprocessing/EffectComposer.js" >> $tgt
cat $src/examples/js/postprocessing/EffectComposer.js >> $tgt
echo "" >> $tgt

echo "// Content of examples/js/postprocessing/MaskPass.js" >> $tgt
cat $src/examples/js/postprocessing/MaskPass.js >> $tgt
echo "" >> $tgt

echo "// Content of examples/js/postprocessing/RenderPass.js" >> $tgt
cat $src/examples/js/postprocessing/RenderPass.js >> $tgt
echo "" >> $tgt

echo "// Content of examples/js/postprocessing/ShaderPass.js" >> $tgt
cat $src/examples/js/postprocessing/ShaderPass.js >> $tgt
echo "" >> $tgt

echo "// Content of examples/js/shaders/SSAOShader.js" >> $tgt
cat $src/examples/js/shaders/SSAOShader.js >> $tgt
echo "" >> $tgt

echo "// Content of examples/js/postprocessing/SSAOPass.js" >> $tgt
cat $src/examples/js/postprocessing/SSAOPass.js >> $tgt
echo "" >> $tgt

echo "// Content of examples/js/math/SimplexNoise.js" >> $tgt
cat $src/examples/js/math/SimplexNoise.js >> $tgt
echo "" >> $tgt

echo "// Content of examples/js/shaders/LuminosityHighPassShader.js" >> $tgt
cat $src/examples/js/shaders/LuminosityHighPassShader.js >> $tgt
echo "" >> $tgt

echo "// Content of examples/js/postprocessing/UnrealBloomPass.js" >> $tgt
cat $src/examples/js/postprocessing/UnrealBloomPass.js >> $tgt
echo "" >> $tgt

echo "if (JSROOT.nodejs) module.exports = THREE;" >> $tgt
echo "return THREE;" >> $tgt
echo "" >> $tgt
echo "});" >> $tgt

echo Producing three.extra.min.js

java -jar ~/d/closure-compiler-v20190909.jar --js $tgt --js_output_file ../scripts/three.extra.min.js

echo Done three.extra.min.js
