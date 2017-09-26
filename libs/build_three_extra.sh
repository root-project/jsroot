#!/bin/bash

# builds three.extra.js
# should be executed inside three distribution package

tgt=three.extra.js

src=/d/three.js-r86
#src=/home/linev/git/threejs
#src2=/d/three.js-r85
src2=/home/linev/git/threejs

rm -rf $tgt
touch $tgt

echo Producing $tgt from $src

cat ./three.extra_head.js >> $tgt
cat $src/examples/fonts/helvetiker_regular.typeface.json >> $tgt
echo "" >> $tgt 
echo "   );" >> $tgt
echo "" >> $tgt 

echo "// Content of examples/js/renderers/Projector.js" >> $tgt 
cat $src/examples/js/renderers/Projector.js >> $tgt
echo "" >> $tgt 

echo "// Content of examples/js/renderers/CanvasRenderer.js" >> $tgt 
cat $src/examples/js/renderers/CanvasRenderer.js >> $tgt
echo "" >> $tgt

echo "// Content of examples/js/renderers/SVGRenderer.js" >> $tgt 
cat $src2/examples/js/renderers/SVGRenderer.js >> $tgt
echo "" >> $tgt
 
echo "// Content of examples/js/controls/OrbitControls.js" >> $tgt 
cat $src/examples/js/controls/OrbitControls.js >> $tgt
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

echo "" >> $tgt
echo "}));" >> $tgt

echo Producing three.extra.min.js

java -jar /d/yuicompressor-2.4.8.jar $tgt -o ../scripts/three.extra.min.js
