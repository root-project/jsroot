/// @file JSRoot3DPainter.js
/// JavaScript ROOT 3D graphics

(function( factory ) {
   if ( typeof define === "function" && define.amd ) {
      // AMD. Register as an anonymous module.
      define( ['JSRootPainter', 'd3', 'threejs', 'threejs_all'], factory );
   } else
   if (typeof exports === 'object' && typeof module !== 'undefined') {
      var jsroot = require("./JSRootCore.js");
      factory(jsroot, require("./d3.min.js"), require("./three.min.js"), require("./three.extra.min.js"),
              jsroot.nodejs || (typeof document=='undefined') ? jsroot.nodejs_document : document);
   } else {

      if (typeof JSROOT == 'undefined')
         throw new Error('JSROOT is not defined', 'JSRoot3DPainter.js');

      if (typeof d3 != 'object')
         throw new Error('This extension requires d3.js', 'JSRoot3DPainter.js');

      if (typeof THREE == 'undefined')
         throw new Error('THREE is not defined', 'JSRoot3DPainter.js');

      factory(JSROOT, d3, THREE);
   }
} (function(JSROOT, d3, THREE, THREE_MORE, document) {

   if ((typeof document=='undefined') && (typeof window=='object')) document = window.document;

   if (typeof JSROOT.Painter != 'object')
      throw new Error('JSROOT.Painter is not defined', 'JSRoot3DPainter.js');

   // ========================== temporary here, later move to three.extra.js =============================


   THREE.RenderableFaceNew = function () {
      // compact form with plain array for all important attributes

      this.id = 0;
      this.z = 0;
      this.renderOrder = 0;
      this.arr = new Float32Array(6+3); // 6 positionScreen + 3 normalModel + 9 positionWorld

   };


   var gdebug = false;

   THREE.ProjectorNew = function () {

      var _object, _objectCount, _objectPool = [], _objectPoolLength = 0,
         _vertex, _vertexCount, _vertexPool = [], _vertexPoolLength = 0,
         _face, _faceCount, _facePool = [], _facePoolLength = 0,
         _line, _lineCount, _linePool = [], _linePoolLength = 0,
         _sprite, _spriteCount, _spritePool = [], _spritePoolLength = 0,
         _vertex1, _vertex2, _vertex3, _debug = 0,

         _renderData = { objects: [], lights: [], elements: [] },

         _vector3 = new THREE.Vector3(),
         _vector4 = new THREE.Vector4(),

         _clipBox = new THREE.Box3( new THREE.Vector3( - 1, - 1, - 1 ), new THREE.Vector3( 1, 1, 1 ) ),
         _boundingBox = new THREE.Box3(),
         _points3 = new Array( 3 ),

         _viewMatrix = new THREE.Matrix4(),
         _viewProjectionMatrix = new THREE.Matrix4(),

         _modelMatrix,
         _modelViewProjectionMatrix = new THREE.Matrix4(),

         _normalMatrix = new THREE.Matrix3(),

         _frustum = new THREE.Frustum(),

         _clippedVertex1PositionScreen = new THREE.Vector4(),
         _clippedVertex2PositionScreen = new THREE.Vector4();

      //

      this.projectVector = function ( vector, camera ) {

         console.warn( 'THREE.ProjectorNew: .projectVector() is now vector.project().' );
         vector.project( camera );

      };

      this.unprojectVector = function ( vector, camera ) {

         console.warn( 'THREE.ProjectorNew: .unprojectVector() is now vector.unproject().' );
         vector.unproject( camera );

      };

      this.pickingRay = function () {

         console.error( 'THREE.ProjectorNew: .pickingRay() is now raycaster.setFromCamera().' );

      };

      //

      var RenderListNew = function () {

         var normals = [];
         var colors = [];
         var uvs = [];

         var object = null;
         var material = null;

         var normalMatrix = new THREE.Matrix3();

         function setObject( value ) {

            object = value;
            material = object.material;

            normalMatrix.getNormalMatrix( object.matrixWorld );

            normals.length = 0;
            colors.length = 0;
            uvs.length = 0;

         }

         function projectVertex( vertex ) {

            var position = vertex.position;
            var positionWorld = vertex.positionWorld;
            var positionScreen = vertex.positionScreen;

            positionWorld.copy( position ).applyMatrix4( _modelMatrix );
            positionScreen.copy( positionWorld ).applyMatrix4( _viewProjectionMatrix );

            var invW = 1 / positionScreen.w;

            positionScreen.x *= invW;
            positionScreen.y *= invW;
            positionScreen.z *= invW;

            vertex.visible = positionScreen.x >= - 1 && positionScreen.x <= 1 &&
                   positionScreen.y >= - 1 && positionScreen.y <= 1 &&
                   positionScreen.z >= - 1 && positionScreen.z <= 1;

         }

         function pushVertex( x, y, z ) {

            _vertex = getNextVertexInPool();
            _vertex.position.set( x, y, z );

            projectVertex( _vertex );

         }

         function pushNormal( x, y, z ) {

            normals.push( x, y, z );

         }

         function pushColor( r, g, b ) {

            colors.push( r, g, b );

         }

         function pushUv( x, y ) {

            uvs.push( x, y );

         }

         function checkTriangleVisibility( v1, v2, v3 ) {

            if ( v1.visible === true || v2.visible === true || v3.visible === true ) return true;

            _points3[ 0 ] = v1.positionScreen;
            _points3[ 1 ] = v2.positionScreen;
            _points3[ 2 ] = v3.positionScreen;

            return _clipBox.intersectsBox( _boundingBox.setFromPoints( _points3 ) );

         }

         function checkBackfaceCulling( v1, v2, v3 ) {

            return ( ( v3.positionScreen.x - v1.positionScreen.x ) *
                   ( v2.positionScreen.y - v1.positionScreen.y ) -
                   ( v3.positionScreen.y - v1.positionScreen.y ) *
                   ( v2.positionScreen.x - v1.positionScreen.x ) ) < 0;

         }

         function pushLine( a, b ) {

            var v1 = _vertexPool[ a ];
            var v2 = _vertexPool[ b ];

            // Clip

            v1.positionScreen.copy( v1.position ).applyMatrix4( _modelViewProjectionMatrix );
            v2.positionScreen.copy( v2.position ).applyMatrix4( _modelViewProjectionMatrix );

            if ( clipLine( v1.positionScreen, v2.positionScreen ) === true ) {

               // Perform the perspective divide
               v1.positionScreen.multiplyScalar( 1 / v1.positionScreen.w );
               v2.positionScreen.multiplyScalar( 1 / v2.positionScreen.w );

               _line = getNextLineInPool();
               _line.id = object.id;
               _line.v1.copy( v1 );
               _line.v2.copy( v2 );
               _line.z = Math.max( v1.positionScreen.z, v2.positionScreen.z );
               _line.renderOrder = object.renderOrder;

               _line.material = object.material;

               if ( object.material.vertexColors === THREE.VertexColors ) {

                  _line.vertexColors[ 0 ].fromArray( colors, a * 3 );
                  _line.vertexColors[ 1 ].fromArray( colors, b * 3 );

               }

               _renderData.elements.push( _line );

            }

         }

         function pushTriangle( a, b, c ) {

            var v1 = _vertexPool[ a ],
                v2 = _vertexPool[ b ],
                v3 = _vertexPool[ c ];

            if (gdebug && (_faceCount<1480)) {
               console.log('VERT', v1.position.x.toFixed(4), v1.position.y.toFixed(4), v1.position.z.toFixed(4));
               console.log('VERT', v2.position.x.toFixed(4), v2.position.y.toFixed(4), v2.position.z.toFixed(4));
               console.log('VERT', v3.position.x.toFixed(4), v3.position.y.toFixed(4), v3.position.z.toFixed(4));
            }

            if ( checkTriangleVisibility( v1, v2, v3 ) === false ) return;

            if ( material.side === THREE.DoubleSide || checkBackfaceCulling( v1, v2, v3 ) === true ) {

               _face = getNextFaceInPool();

               _face.id = object.id;
               _face.v1.copy( v1 );
               _face.v2.copy( v2 );
               _face.v3.copy( v3 );
               _face.z = ( v1.positionScreen.z + v2.positionScreen.z + v3.positionScreen.z ) / 3;
               _face.renderOrder = object.renderOrder;


               if (gdebug && (_faceCount<1480)) console.log(_faceCount, 'PUSH ', _face.z.toFixed(4),
                     v1.positionScreen.x.toFixed(4), v1.positionScreen.y.toFixed(4),
                     v2.positionScreen.x.toFixed(4), v2.positionScreen.y.toFixed(4),
                     v3.positionScreen.x.toFixed(4), v3.positionScreen.y.toFixed(4));

               // use first vertex normal as face normal

               _face.normalModel.fromArray( normals, a * 3 );
               _face.normalModel.applyMatrix3( normalMatrix ).normalize();

               for ( var i = 0; i < 3; i ++ ) {

                  var normal = _face.vertexNormalsModel[ i ];
                  normal.fromArray( normals, arguments[ i ] * 3 );
                  normal.applyMatrix3( normalMatrix ).normalize();

                  var uv = _face.uvs[ i ];
                  uv.fromArray( uvs, arguments[ i ] * 2 );

               }

               _face.vertexNormalsLength = 3;

               _face.material = object.material;

               _renderData.elements.push( _face );

            }

         }

         function pushTriangleNew(pos, norm, ia, ib, ic ) {
            if (!_vertex1) {
               _vertex1 = getNextVertexInPool();
               _vertex2 = getNextVertexInPool();
               _vertex3 = getNextVertexInPool();
            }

            _vertex1.position.set( pos[ia], pos[ia+1], pos[ia+2]);
            projectVertex( _vertex1 );

            _vertex2.position.set( pos[ib], pos[ib+1], pos[ib+2]);
            projectVertex( _vertex2 );

            _vertex3.position.set( pos[ic], pos[ic+1], pos[ic+2]);
            projectVertex( _vertex3 );

            _debug++;

            if (gdebug && (_debug<20)) {
               console.log("VERT", pos[ia].toFixed(4), pos[ia+1].toFixed(4), pos[ia+2].toFixed(4));
               console.log("VERT", pos[ib].toFixed(4), pos[ib+1].toFixed(4), pos[ib+2].toFixed(4));
               console.log("VERT", pos[ic].toFixed(4), pos[ic+1].toFixed(4), pos[ic+2].toFixed(4));
            }

            //if (_debug < 50) console.log('create new triangle');

            if ( checkTriangleVisibility( _vertex1, _vertex2, _vertex3 ) === false ) return;

            //if (_debug < 50)
            //   console.log('checked visibility', _vertex1.positionScreen.z, _vertex2.positionScreen.z, _vertex3.positionScreen.z, 'cull', checkBackfaceCulling( _vertex1, _vertex2, _vertex3 ));

            if ( material.side === THREE.DoubleSide || checkBackfaceCulling( _vertex1, _vertex2, _vertex3 ) === true )
              {

               _face = new THREE.RenderableFaceNew();

               _face.id = object.id;
               _face.z = ( _vertex1.positionScreen.z + _vertex2.positionScreen.z + _vertex3.positionScreen.z ) / 3;
               _face.renderOrder = object.renderOrder;


               if (gdebug && (_debug<20)) console.log('PUSH ', _face.z.toFixed(4),
                     _vertex1.positionScreen.x.toFixed(4), _vertex1.positionScreen.y.toFixed(4),
                     _vertex2.positionScreen.x.toFixed(4), _vertex2.positionScreen.y.toFixed(4),
                     _vertex3.positionScreen.x.toFixed(4), _vertex3.positionScreen.y.toFixed(4));




               _face.arr[0] = _vertex1.positionScreen.x;
               _face.arr[1] = _vertex1.positionScreen.y;
               _face.arr[2] = _vertex2.positionScreen.x;
               _face.arr[3] = _vertex2.positionScreen.y;
               _face.arr[4] = _vertex3.positionScreen.x;
               _face.arr[5] = _vertex3.positionScreen.y;

               // use first vertex normal as face normal, can improve later
               _face.arr[6] = norm[ia];
               _face.arr[7] = norm[ia+1];
               _face.arr[8] = norm[ia+2];

               // TODO: copy positionWorld for some special materials

               _face.material = object.material;

               _renderData.elements.push( _face );

               //if (_debug < 50)
               //   console.log('add to render data', _renderData.elements.length);
            }

         }

         return {
            setObject: setObject,
            projectVertex: projectVertex,
            checkTriangleVisibility: checkTriangleVisibility,
            checkBackfaceCulling: checkBackfaceCulling,
            pushVertex: pushVertex,
            pushNormal: pushNormal,
            pushColor: pushColor,
            pushUv: pushUv,
            pushLine: pushLine,
            pushTriangle: pushTriangle,
            pushTriangleNew: pushTriangleNew
         };

      };

      var renderList = new RenderListNew();

      function projectObject( object ) {

         if ( object.visible === false ) return;

         if ( object instanceof THREE.Light ) {

            _renderData.lights.push( object );

         } else if ( object instanceof THREE.Mesh || object instanceof THREE.Line || object instanceof THREE.Points ) {

            if ( object.material.visible === false ) return;
            if ( object.frustumCulled === true && _frustum.intersectsObject( object ) === false ) return;

            addObject( object );

         } else if ( object instanceof THREE.Sprite ) {

            if ( object.material.visible === false ) return;
            if ( object.frustumCulled === true && _frustum.intersectsSprite( object ) === false ) return;

            addObject( object );

         }

         var children = object.children;

         for ( var i = 0, l = children.length; i < l; i ++ ) {

            projectObject( children[ i ] );

         }

      }

      function addObject( object ) {

         _object = getNextObjectInPool();
         _object.id = object.id;
         _object.object = object;

         _vector3.setFromMatrixPosition( object.matrixWorld );
         _vector3.applyMatrix4( _viewProjectionMatrix );
         _object.z = _vector3.z;
         _object.renderOrder = object.renderOrder;

         _renderData.objects.push( _object );

      }

      this.projectScene = function ( scene, camera, sortObjects, sortElements ) {

         _faceCount = 0;
         _lineCount = 0;
         _spriteCount = 0;

         _renderData.elements.length = 0;

         if ( scene.autoUpdate === true ) scene.updateMatrixWorld();
         if ( camera.parent === null ) camera.updateMatrixWorld();

         _viewMatrix.copy( camera.matrixWorldInverse.getInverse( camera.matrixWorld ) );
         _viewProjectionMatrix.multiplyMatrices( camera.projectionMatrix, _viewMatrix );

         _frustum.setFromMatrix( _viewProjectionMatrix );

         //

         _objectCount = 0;

         _renderData.objects.length = 0;
         _renderData.lights.length = 0;

         projectObject( scene );

         if ( sortObjects === true ) {

            _renderData.objects.sort( painterSort );

         }

         //

         var objects = _renderData.objects, _debug2 = 0;

         for ( var o = 0, ol = objects.length; o < ol; o ++ ) {

            var object = objects[ o ].object,
                geometry = object.geometry;

            renderList.setObject( object );

            _modelMatrix = object.matrixWorld;

            _vertexCount = 0;
            _vertex1 = _vertex2 = _vertex3 = null;

            if ( object instanceof THREE.Mesh ) {

               if ( geometry instanceof THREE.BufferGeometry ) {

                  var attributes = geometry.attributes;
                  var groups = geometry.groups;

                  if ( attributes.position === undefined ) continue;

                  var positions = attributes.position.array;

                  // if (++_debug2 < 10) console.log(_debug2, 'Process bufgeometry', !!attributes.normal, !!attributes.uv, groups ? groups.length : '-1');

                  // gdebug = (_debug2 === 1);

                  if (attributes.normal && !attributes.uv && groups.length==0) {
                     // try to cover most important usecase

                     var normals = attributes.normal.array;

                     if ( geometry.index !== null ) {
                        // with index
                        var indices = geometry.index.array;

                        for ( var i = 0, l = indices.length; i < l; i += 3 ) {
                           renderList.pushTriangleNew(positions, normals, indices[ i ], indices[ i + 1 ], indices[ i + 2 ] );
                        }

                     } else {

                         // without index
                         for ( var i = 0, l = positions.length; i < l; i += 9 ) {
                           renderList.pushTriangleNew(positions, normals, i, i + 3, i + 6 );
                        }
                     }

                     continue;
                  }



                  for ( var i = 0, l = positions.length; i < l; i += 3 ) {

                     renderList.pushVertex( positions[ i ], positions[ i + 1 ], positions[ i + 2 ] );

                  }

                  if ( attributes.normal !== undefined ) {

                     var normals = attributes.normal.array;

                     for ( var i = 0, l = normals.length; i < l; i += 3 ) {

                        renderList.pushNormal( normals[ i ], normals[ i + 1 ], normals[ i + 2 ] );

                     }

                  }

                  if ( attributes.uv !== undefined ) {

                     var uvs = attributes.uv.array;

                     for ( var i = 0, l = uvs.length; i < l; i += 2 ) {

                        renderList.pushUv( uvs[ i ], uvs[ i + 1 ] );

                     }

                  }

                  if ( geometry.index !== null ) {

                     var indices = geometry.index.array;

                     if ( groups.length > 0 ) {

                        if (gdebug) console.log('WITH GROUPS');


                        for ( var g = 0; g < groups.length; g ++ ) {

                           var group = groups[ g ];

                           for ( var i = group.start, l = group.start + group.count; i < l; i += 3 ) {

                              renderList.pushTriangle( indices[ i ], indices[ i + 1 ], indices[ i + 2 ] );

                           }

                        }

                     } else {

                        if (gdebug) console.log('WITH INDEXES');

                        for ( var i = 0, l = indices.length; i < l; i += 3 ) {

                           renderList.pushTriangle( indices[ i ], indices[ i + 1 ], indices[ i + 2 ] );

                        }

                     }

                  } else {

                     if (gdebug) console.log('DIRECT');

                     for ( var i = 0, l = positions.length / 3; i < l; i += 3 ) {

                        renderList.pushTriangle( i, i + 1, i + 2 );

                     }

                  }

               } else if ( geometry instanceof THREE.Geometry ) {

                  var vertices = geometry.vertices;
                  var faces = geometry.faces;
                  var faceVertexUvs = geometry.faceVertexUvs[ 0 ];

                  _normalMatrix.getNormalMatrix( _modelMatrix );

                  var material = object.material;

                  var isMultiMaterial = Array.isArray( material );

                  for ( var v = 0, vl = vertices.length; v < vl; v ++ ) {

                     var vertex = vertices[ v ];

                     _vector3.copy( vertex );

                     if ( material.morphTargets === true ) {

                        var morphTargets = geometry.morphTargets;
                        var morphInfluences = object.morphTargetInfluences;

                        for ( var t = 0, tl = morphTargets.length; t < tl; t ++ ) {

                           var influence = morphInfluences[ t ];

                           if ( influence === 0 ) continue;

                           var target = morphTargets[ t ];
                           var targetVertex = target.vertices[ v ];

                           _vector3.x += ( targetVertex.x - vertex.x ) * influence;
                           _vector3.y += ( targetVertex.y - vertex.y ) * influence;
                           _vector3.z += ( targetVertex.z - vertex.z ) * influence;

                        }

                     }

                     renderList.pushVertex( _vector3.x, _vector3.y, _vector3.z );

                  }

                  for ( var f = 0, fl = faces.length; f < fl; f ++ ) {

                     var face = faces[ f ];

                     material = isMultiMaterial === true
                         ? object.material[ face.materialIndex ]
                         : object.material;

                     if ( material === undefined ) continue;

                     var side = material.side;

                     var v1 = _vertexPool[ face.a ];
                     var v2 = _vertexPool[ face.b ];
                     var v3 = _vertexPool[ face.c ];

                     if ( renderList.checkTriangleVisibility( v1, v2, v3 ) === false ) continue;

                     var visible = renderList.checkBackfaceCulling( v1, v2, v3 );

                     if ( side !== THREE.DoubleSide ) {

                        if ( side === THREE.FrontSide && visible === false ) continue;
                        if ( side === THREE.BackSide && visible === true ) continue;

                     }

                     _face = getNextFaceInPool();

                     _face.id = object.id;
                     _face.v1.copy( v1 );
                     _face.v2.copy( v2 );
                     _face.v3.copy( v3 );

                     _face.normalModel.copy( face.normal );

                     if ( visible === false && ( side === THREE.BackSide || side === THREE.DoubleSide ) ) {

                        _face.normalModel.negate();

                     }

                     _face.normalModel.applyMatrix3( _normalMatrix ).normalize();

                     var faceVertexNormals = face.vertexNormals;

                     for ( var n = 0, nl = Math.min( faceVertexNormals.length, 3 ); n < nl; n ++ ) {

                        var normalModel = _face.vertexNormalsModel[ n ];
                        normalModel.copy( faceVertexNormals[ n ] );

                        if ( visible === false && ( side === THREE.BackSide || side === THREE.DoubleSide ) ) {

                           normalModel.negate();

                        }

                        normalModel.applyMatrix3( _normalMatrix ).normalize();

                     }

                     _face.vertexNormalsLength = faceVertexNormals.length;

                     var vertexUvs = faceVertexUvs[ f ];

                     if ( vertexUvs !== undefined ) {

                        for ( var u = 0; u < 3; u ++ ) {

                           _face.uvs[ u ].copy( vertexUvs[ u ] );

                        }

                     }

                     _face.color = face.color;
                     _face.material = material;

                     _face.z = ( v1.positionScreen.z + v2.positionScreen.z + v3.positionScreen.z ) / 3;
                     _face.renderOrder = object.renderOrder;

                     _renderData.elements.push( _face );

                  }

               }

            } else if ( object instanceof THREE.Line ) {

               _modelViewProjectionMatrix.multiplyMatrices( _viewProjectionMatrix, _modelMatrix );

               if ( geometry instanceof THREE.BufferGeometry ) {

                  var attributes = geometry.attributes;

                  if ( attributes.position !== undefined ) {

                     var positions = attributes.position.array;

                     for ( var i = 0, l = positions.length; i < l; i += 3 ) {

                        renderList.pushVertex( positions[ i ], positions[ i + 1 ], positions[ i + 2 ] );

                     }

                     if ( attributes.color !== undefined ) {

                        var colors = attributes.color.array;

                        for ( var i = 0, l = colors.length; i < l; i += 3 ) {

                           renderList.pushColor( colors[ i ], colors[ i + 1 ], colors[ i + 2 ] );

                        }

                     }

                     if ( geometry.index !== null ) {

                        var indices = geometry.index.array;

                        for ( var i = 0, l = indices.length; i < l; i += 2 ) {

                           renderList.pushLine( indices[ i ], indices[ i + 1 ] );

                        }

                     } else {

                        var step = object instanceof THREE.LineSegments ? 2 : 1;

                        for ( var i = 0, l = ( positions.length / 3 ) - 1; i < l; i += step ) {

                           renderList.pushLine( i, i + 1 );

                        }

                     }

                  }

               } else if ( geometry instanceof THREE.Geometry ) {

                  var vertices = object.geometry.vertices;

                  if ( vertices.length === 0 ) continue;

                  v1 = getNextVertexInPool();
                  v1.positionScreen.copy( vertices[ 0 ] ).applyMatrix4( _modelViewProjectionMatrix );

                  var step = object instanceof THREE.LineSegments ? 2 : 1;

                  for ( var v = 1, vl = vertices.length; v < vl; v ++ ) {

                     v1 = getNextVertexInPool();
                     v1.positionScreen.copy( vertices[ v ] ).applyMatrix4( _modelViewProjectionMatrix );

                     if ( ( v + 1 ) % step > 0 ) continue;

                     v2 = _vertexPool[ _vertexCount - 2 ];

                     _clippedVertex1PositionScreen.copy( v1.positionScreen );
                     _clippedVertex2PositionScreen.copy( v2.positionScreen );

                     if ( clipLine( _clippedVertex1PositionScreen, _clippedVertex2PositionScreen ) === true ) {

                        // Perform the perspective divide
                        _clippedVertex1PositionScreen.multiplyScalar( 1 / _clippedVertex1PositionScreen.w );
                        _clippedVertex2PositionScreen.multiplyScalar( 1 / _clippedVertex2PositionScreen.w );

                        _line = getNextLineInPool();

                        _line.id = object.id;
                        _line.v1.positionScreen.copy( _clippedVertex1PositionScreen );
                        _line.v2.positionScreen.copy( _clippedVertex2PositionScreen );

                        _line.z = Math.max( _clippedVertex1PositionScreen.z, _clippedVertex2PositionScreen.z );
                        _line.renderOrder = object.renderOrder;

                        _line.material = object.material;

                        if ( object.material.vertexColors === THREE.VertexColors ) {

                           _line.vertexColors[ 0 ].copy( object.geometry.colors[ v ] );
                           _line.vertexColors[ 1 ].copy( object.geometry.colors[ v - 1 ] );

                        }

                        _renderData.elements.push( _line );

                     }

                  }

               }

            } else if ( object instanceof THREE.Points ) {

               _modelViewProjectionMatrix.multiplyMatrices( _viewProjectionMatrix, _modelMatrix );

               if ( geometry instanceof THREE.Geometry ) {

                  var vertices = object.geometry.vertices;

                  for ( var v = 0, vl = vertices.length; v < vl; v ++ ) {

                     var vertex = vertices[ v ];

                     _vector4.set( vertex.x, vertex.y, vertex.z, 1 );
                     _vector4.applyMatrix4( _modelViewProjectionMatrix );

                     pushPoint( _vector4, object, camera );

                  }

               }

            } else if ( object instanceof THREE.Sprite ) {

               _vector4.set( _modelMatrix.elements[ 12 ], _modelMatrix.elements[ 13 ], _modelMatrix.elements[ 14 ], 1 );
               _vector4.applyMatrix4( _viewProjectionMatrix );

               pushPoint( _vector4, object, camera );

            }

         }

         if ( sortElements === true ) {

            _renderData.elements.sort( painterSort );

         }

         return _renderData;

      };

      function pushPoint( _vector4, object, camera ) {

         var invW = 1 / _vector4.w;

         _vector4.z *= invW;

         if ( _vector4.z >= - 1 && _vector4.z <= 1 ) {

            _sprite = getNextSpriteInPool();
            _sprite.id = object.id;
            _sprite.x = _vector4.x * invW;
            _sprite.y = _vector4.y * invW;
            _sprite.z = _vector4.z;
            _sprite.renderOrder = object.renderOrder;
            _sprite.object = object;

            _sprite.rotation = object.rotation;

            _sprite.scale.x = object.scale.x * Math.abs( _sprite.x - ( _vector4.x + camera.projectionMatrix.elements[ 0 ] ) / ( _vector4.w + camera.projectionMatrix.elements[ 12 ] ) );
            _sprite.scale.y = object.scale.y * Math.abs( _sprite.y - ( _vector4.y + camera.projectionMatrix.elements[ 5 ] ) / ( _vector4.w + camera.projectionMatrix.elements[ 13 ] ) );

            _sprite.material = object.material;

            _renderData.elements.push( _sprite );

         }

      }

      // Pools

      function getNextObjectInPool() {

         if ( _objectCount === _objectPoolLength ) {

            var object = new THREE.RenderableObject();
            _objectPool.push( object );
            _objectPoolLength ++;
            _objectCount ++;
            return object;

         }

         return _objectPool[ _objectCount ++ ];

      }

      function getNextVertexInPool() {

         if ( _vertexCount === _vertexPoolLength ) {

            var vertex = new THREE.RenderableVertex();
            _vertexPool.push( vertex );
            _vertexPoolLength ++;
            _vertexCount ++;
            return vertex;

         }

         return _vertexPool[ _vertexCount ++ ];

      }

      function getNextFaceInPool() {

         if ( _faceCount === _facePoolLength ) {

            var face = new THREE.RenderableFace();
            _facePool.push( face );
            _facePoolLength ++;
            _faceCount ++;
            return face;

         }

         return _facePool[ _faceCount ++ ];


      }

      function getNextLineInPool() {

         if ( _lineCount === _linePoolLength ) {

            var line = new THREE.RenderableLine();
            _linePool.push( line );
            _linePoolLength ++;
            _lineCount ++;
            return line;

         }

         return _linePool[ _lineCount ++ ];

      }

      function getNextSpriteInPool() {

         if ( _spriteCount === _spritePoolLength ) {

            var sprite = new THREE.RenderableSprite();
            _spritePool.push( sprite );
            _spritePoolLength ++;
            _spriteCount ++;
            return sprite;

         }

         return _spritePool[ _spriteCount ++ ];

      }

      //

      function painterSort( a, b ) {

         if ( a.renderOrder !== b.renderOrder ) {

            return a.renderOrder - b.renderOrder;

         } else if ( a.z !== b.z ) {

            return b.z - a.z;

         } else if ( a.id !== b.id ) {

            return a.id - b.id;

         } else {

            return 0;

         }

      }

      function clipLine( s1, s2 ) {

         var alpha1 = 0, alpha2 = 1,

         // Calculate the boundary coordinate of each vertex for the near and far clip planes,
         // Z = -1 and Z = +1, respectively.

            bc1near = s1.z + s1.w,
            bc2near = s2.z + s2.w,
            bc1far = - s1.z + s1.w,
            bc2far = - s2.z + s2.w;

         if ( bc1near >= 0 && bc2near >= 0 && bc1far >= 0 && bc2far >= 0 ) {

            // Both vertices lie entirely within all clip planes.
            return true;

         } else if ( ( bc1near < 0 && bc2near < 0 ) || ( bc1far < 0 && bc2far < 0 ) ) {

            // Both vertices lie entirely outside one of the clip planes.
            return false;

         } else {

            // The line segment spans at least one clip plane.

            if ( bc1near < 0 ) {

               // v1 lies outside the near plane, v2 inside
               alpha1 = Math.max( alpha1, bc1near / ( bc1near - bc2near ) );

            } else if ( bc2near < 0 ) {

               // v2 lies outside the near plane, v1 inside
               alpha2 = Math.min( alpha2, bc1near / ( bc1near - bc2near ) );

            }

            if ( bc1far < 0 ) {

               // v1 lies outside the far plane, v2 inside
               alpha1 = Math.max( alpha1, bc1far / ( bc1far - bc2far ) );

            } else if ( bc2far < 0 ) {

               // v2 lies outside the far plane, v2 inside
               alpha2 = Math.min( alpha2, bc1far / ( bc1far - bc2far ) );

            }

            if ( alpha2 < alpha1 ) {

               // The line segment spans two boundaries, but is outside both of them.
               // (This can't happen when we're only clipping against just near/far but good
               //  to leave the check here for future usage if other clip planes are added.)
               return false;

            } else {

               // Update the s1 and s2 vertices to match the clipped line segment.
               s1.lerp( s2, alpha1 );
               s2.lerp( s1, 1 - alpha2 );

               return true;

            }

         }

      }

   };

   THREE.SVGRendererNew = function () {

      console.log( 'THREE.SVGRendererNew', THREE.REVISION );

      var _this = this,
      _renderData, _elements, _lights,
      _projector = new THREE.ProjectorNew(),
      _svg = document.createElementNS( 'http://www.w3.org/2000/svg', 'svg' ),
      _svgWidth, _svgHeight, _svgWidthHalf, _svgHeightHalf,

      _v1, _v2, _v3, _v4,

      _clipBox = new THREE.Box2(),
      _elemBox = new THREE.Box2(),

      _color = new THREE.Color(),
      _diffuseColor = new THREE.Color(),
      _ambientLight = new THREE.Color(),
      _directionalLights = new THREE.Color(),
      _pointLights = new THREE.Color(),
      _clearColor = new THREE.Color(),
      _clearAlpha = 1,

      _vector3 = new THREE.Vector3(), // Needed for PointLight
      _centroid = new THREE.Vector3(),
      _normal = new THREE.Vector3(),
      _normalViewMatrix = new THREE.Matrix3(),

      _viewMatrix = new THREE.Matrix4(),
      _viewProjectionMatrix = new THREE.Matrix4(),

      _svgPathPool = [], _svgLinePool = [], _svgRectPool = [],
      _svgNode, _pathCount = 0, _lineCount = 0, _rectCount = 0,
      _quality = 1;

      this.domElement = _svg;

      this.autoClear = true;
      this.sortObjects = true;
      this.sortElements = true;

      this.info = {

         render: {

            vertices: 0,
            faces: 0

         }

      };

      this.setQuality = function( quality ) {

         switch ( quality ) {

            case "high": _quality = 1; break;
            case "low": _quality = 0; break;

         }

      };

      // WebGLRenderer compatibility

      this.supportsVertexTextures = function () {};
      this.setFaceCulling = function () {};

      this.setClearColor = function ( color, alpha ) {

         _clearColor.set( color );
         _clearAlpha = alpha !== undefined ? alpha : 1;

      };

      this.setPixelRatio = function () {};

      this.setSize = function( width, height ) {

         _svgWidth = width; _svgHeight = height;
         _svgWidthHalf = _svgWidth / 2; _svgHeightHalf = _svgHeight / 2;

         _svg.setAttribute( 'viewBox', ( - _svgWidthHalf ) + ' ' + ( - _svgHeightHalf ) + ' ' + _svgWidth + ' ' + _svgHeight );
         _svg.setAttribute( 'width', _svgWidth );
         _svg.setAttribute( 'height', _svgHeight );

         _clipBox.min.set( - _svgWidthHalf, - _svgHeightHalf );
         _clipBox.max.set( _svgWidthHalf, _svgHeightHalf );

      };

      function removeChildNodes() {

         _pathCount = 0;
         _lineCount = 0;
         _rectCount = 0;

         while ( _svg.childNodes.length > 0 ) {

            _svg.removeChild( _svg.childNodes[ 0 ] );

         }

      }

      this.clear = function () {

         removeChildNodes();
         _svg.style.backgroundColor = 'rgba(' + Math.floor( _clearColor.r * 255 ) + ',' + Math.floor( _clearColor.g * 255 ) + ',' + Math.floor( _clearColor.b * 255 ) + ',' + _clearAlpha + ')';

      };

      this.render = function ( scene, camera ) {

         if ( camera instanceof THREE.Camera === false ) {

            console.error( 'THREE.SVGRendererNew.render: camera is not an instance of THREE.Camera.' );
            return;

         }

         var background = scene.background;

         if ( background && background.isColor ) {

            removeChildNodes();
            _svg.style.backgroundColor = 'rgb(' + Math.floor( background.r * 255 ) + ',' + Math.floor( background.g * 255 ) + ',' + Math.floor( background.b * 255 ) + ')';

         } else if ( this.autoClear === true ) {

            this.clear();

         }

         _this.info.render.vertices = 0;
         _this.info.render.faces = 0;

         _viewMatrix.copy( camera.matrixWorldInverse.getInverse( camera.matrixWorld ) );
         _viewProjectionMatrix.multiplyMatrices( camera.projectionMatrix, _viewMatrix );

         _renderData = _projector.projectScene( scene, camera, this.sortObjects, this.sortElements );
         _elements = _renderData.elements;
         _lights = _renderData.lights;

         _normalViewMatrix.getNormalMatrix( camera.matrixWorldInverse );

         calculateLights( _lights );

         for ( var e = 0, el = _elements.length; e < el; e ++ ) {

            var element = _elements[ e ];
            var material = element.material;

            if ( material === undefined || material.opacity === 0 ) continue;

            _elemBox.makeEmpty();

            if ( element instanceof THREE.RenderableFaceNew ) {

               //if (e < 2000) console.log('check new face');


               element.arr[0] *= _svgWidthHalf;
               element.arr[1] *= -_svgHeightHalf;
               element.arr[2] *= _svgWidthHalf;
               element.arr[3] *= -_svgHeightHalf;
               element.arr[4] *= _svgWidthHalf;
               element.arr[5] *= -_svgHeightHalf;

               _elemBox.min.x = Math.min(element.arr[0], element.arr[2], element.arr[4]);
               _elemBox.max.x = Math.max(element.arr[0], element.arr[2], element.arr[4]);
               _elemBox.min.y = Math.min(element.arr[1], element.arr[3], element.arr[5]);
               _elemBox.max.y = Math.max(element.arr[1], element.arr[3], element.arr[5]);

               if ( _clipBox.intersectsBox( _elemBox ) === true ) {

                  //if (e < 2000) console.log('render new face');

                  renderFace3New( element, material );
               }

            } else  if ( element instanceof THREE.RenderableSprite ) {

               _v1 = element;
               _v1.x *= _svgWidthHalf; _v1.y *= - _svgHeightHalf;

               renderSprite( _v1, element, material );

            } else if ( element instanceof THREE.RenderableLine ) {

               _v1 = element.v1; _v2 = element.v2;

               _v1.positionScreen.x *= _svgWidthHalf; _v1.positionScreen.y *= - _svgHeightHalf;
               _v2.positionScreen.x *= _svgWidthHalf; _v2.positionScreen.y *= - _svgHeightHalf;

               _elemBox.setFromPoints( [ _v1.positionScreen, _v2.positionScreen ] );

               if ( _clipBox.intersectsBox( _elemBox ) === true ) {

                  renderLine( _v1, _v2, element, material );

               }

            } else if ( element instanceof THREE.RenderableFace ) {

               _v1 = element.v1; _v2 = element.v2; _v3 = element.v3;

               if ( _v1.positionScreen.z < - 1 || _v1.positionScreen.z > 1 ) continue;
               if ( _v2.positionScreen.z < - 1 || _v2.positionScreen.z > 1 ) continue;
               if ( _v3.positionScreen.z < - 1 || _v3.positionScreen.z > 1 ) continue;

               _v1.positionScreen.x *= _svgWidthHalf; _v1.positionScreen.y *= - _svgHeightHalf;
               _v2.positionScreen.x *= _svgWidthHalf; _v2.positionScreen.y *= - _svgHeightHalf;
               _v3.positionScreen.x *= _svgWidthHalf; _v3.positionScreen.y *= - _svgHeightHalf;

               _elemBox.setFromPoints( [
                  _v1.positionScreen,
                  _v2.positionScreen,
                  _v3.positionScreen
               ] );

               if ( _clipBox.intersectsBox( _elemBox ) === true ) {

                  renderFace3( _v1, _v2, _v3, element, material );

               }

            }

         }

         scene.traverseVisible( function ( object ) {

             if ( object instanceof THREE.SVGObject ) {

               _vector3.setFromMatrixPosition( object.matrixWorld );
               _vector3.applyMatrix4( _viewProjectionMatrix );

               var x =   _vector3.x * _svgWidthHalf;
               var y = - _vector3.y * _svgHeightHalf;

               var node = object.node;
               node.setAttribute( 'transform', 'translate(' + x + ',' + y + ')' );

               _svg.appendChild( node );

            }

         } );

      };

      function calculateLights( lights ) {

         _ambientLight.setRGB( 0, 0, 0 );
         _directionalLights.setRGB( 0, 0, 0 );
         _pointLights.setRGB( 0, 0, 0 );

         for ( var l = 0, ll = lights.length; l < ll; l ++ ) {

            var light = lights[ l ];
            var lightColor = light.color;

            if ( light instanceof THREE.AmbientLight ) {

               _ambientLight.r += lightColor.r;
               _ambientLight.g += lightColor.g;
               _ambientLight.b += lightColor.b;

            } else if ( light instanceof THREE.DirectionalLight ) {

               _directionalLights.r += lightColor.r;
               _directionalLights.g += lightColor.g;
               _directionalLights.b += lightColor.b;

            } else if ( light instanceof THREE.PointLight ) {

               _pointLights.r += lightColor.r;
               _pointLights.g += lightColor.g;
               _pointLights.b += lightColor.b;

            }

         }

      }

      function calculateLight( lights, position, normal, color ) {

         for ( var l = 0, ll = lights.length; l < ll; l ++ ) {

            var light = lights[ l ];
            var lightColor = light.color;

            if ( light instanceof THREE.DirectionalLight ) {

               var lightPosition = _vector3.setFromMatrixPosition( light.matrixWorld ).normalize();

               var amount = normal.dot( lightPosition );

               if ( amount <= 0 ) continue;

               amount *= light.intensity;

               color.r += lightColor.r * amount;
               color.g += lightColor.g * amount;
               color.b += lightColor.b * amount;

            } else if ( light instanceof THREE.PointLight ) {

               var lightPosition = _vector3.setFromMatrixPosition( light.matrixWorld );

               var amount = normal.dot( _vector3.subVectors( lightPosition, position ).normalize() );

               if ( amount <= 0 ) continue;

               amount *= light.distance == 0 ? 1 : 1 - Math.min( position.distanceTo( lightPosition ) / light.distance, 1 );

               if ( amount == 0 ) continue;

               amount *= light.intensity;

               color.r += lightColor.r * amount;
               color.g += lightColor.g * amount;
               color.b += lightColor.b * amount;

            }

         }

      }

      function renderSprite( v1, element, material ) {

         var scaleX = element.scale.x * _svgWidthHalf;
         var scaleY = element.scale.y * _svgHeightHalf;

         _svgNode = getRectNode( _rectCount ++ );

         _svgNode.setAttribute( 'x', v1.x - ( scaleX * 0.5 ) );
         _svgNode.setAttribute( 'y', v1.y - ( scaleY * 0.5 ) );
         _svgNode.setAttribute( 'width', scaleX );
         _svgNode.setAttribute( 'height', scaleY );

         if ( material instanceof THREE.SpriteMaterial ) {

            _svgNode.setAttribute( 'style', 'fill: ' + material.color.getStyle() );

         }

         _svg.appendChild( _svgNode );

      }

      function renderLine( v1, v2, element, material ) {

         _svgNode = getLineNode( _lineCount ++ );

         _svgNode.setAttribute( 'x1', v1.positionScreen.x );
         _svgNode.setAttribute( 'y1', v1.positionScreen.y );
         _svgNode.setAttribute( 'x2', v2.positionScreen.x );
         _svgNode.setAttribute( 'y2', v2.positionScreen.y );

         if ( material instanceof THREE.LineBasicMaterial ) {

            _svgNode.setAttribute( 'style', 'fill: none; stroke: ' + material.color.getStyle() + '; stroke-width: ' + material.linewidth + '; stroke-opacity: ' + material.opacity + '; stroke-linecap: ' + material.linecap + '; stroke-linejoin: ' + material.linejoin );

            _svg.appendChild( _svgNode );

         }

      }

      function renderFace3( v1, v2, v3, element, material ) {

         _this.info.render.vertices += 3;
         _this.info.render.faces ++;

         _svgNode = getPathNode( _pathCount ++ );
         _svgNode.setAttribute( 'd', 'M ' + v1.positionScreen.x + ' ' + v1.positionScreen.y + ' L ' + v2.positionScreen.x + ' ' + v2.positionScreen.y + ' L ' + v3.positionScreen.x + ',' + v3.positionScreen.y + 'z' );

         if ( material instanceof THREE.MeshBasicMaterial ) {

            _color.copy( material.color );

            if ( material.vertexColors === THREE.FaceColors ) {

               _color.multiply( element.color );

            }

         } else if ( material instanceof THREE.MeshLambertMaterial || material instanceof THREE.MeshPhongMaterial ) {

            _diffuseColor.copy( material.color );

            if ( material.vertexColors === THREE.FaceColors ) {

               _diffuseColor.multiply( element.color );

            }

            _color.copy( _ambientLight );

            _centroid.copy( v1.positionWorld ).add( v2.positionWorld ).add( v3.positionWorld ).divideScalar( 3 );

            calculateLight( _lights, _centroid, element.normalModel, _color );

            _color.multiply( _diffuseColor ).add( material.emissive );

         } else if ( material instanceof THREE.MeshNormalMaterial ) {

            _normal.copy( element.normalModel ).applyMatrix3( _normalViewMatrix );

            _color.setRGB( _normal.x, _normal.y, _normal.z ).multiplyScalar( 0.5 ).addScalar( 0.5 );

         }

         if ( material.wireframe ) {

            _svgNode.setAttribute( 'style', 'fill: none; stroke: ' + _color.getStyle() + '; stroke-width: ' + material.wireframeLinewidth + '; stroke-opacity: ' + material.opacity + '; stroke-linecap: ' + material.wireframeLinecap + '; stroke-linejoin: ' + material.wireframeLinejoin );

         } else {

            _svgNode.setAttribute( 'style', 'fill: ' + _color.getStyle() + '; fill-opacity: ' + material.opacity );

         }

         _svg.appendChild( _svgNode );

      }

      function renderFace3New( element, material ) {

         _this.info.render.vertices += 3;
         _this.info.render.faces ++;

         _svgNode = getPathNode( _pathCount ++ );
         _svgNode.setAttribute( 'd', 'M ' + element.arr[0] + ' ' + element.arr[1] + ' L ' + element.arr[2] + ' ' + element.arr[3] + ' L ' + element.arr[4] + ' ' + element.arr[5] + 'z' );

         if ( material instanceof THREE.MeshBasicMaterial ) {

            _color.copy( material.color );

            //if ( material.vertexColors === THREE.FaceColors ) {
            //   _color.multiply( element.color );
            // }

         } else if ( material instanceof THREE.MeshLambertMaterial || material instanceof THREE.MeshPhongMaterial ) {

            _diffuseColor.copy( material.color );

            //if ( material.vertexColors === THREE.FaceColors ) {
            //   _diffuseColor.multiply( element.color );
            //}

            _color.copy( _ambientLight );

            throw new Error('Not yet supported material kinds');

            _centroid.copy( v1.positionWorld ).add( v2.positionWorld ).add( v3.positionWorld ).divideScalar( 3 );

            calculateLight( _lights, _centroid, element.normalModel, _color );

            _color.multiply( _diffuseColor ).add( material.emissive );

         } else if ( material instanceof THREE.MeshNormalMaterial ) {

            _normal.set(element.arr[6], element.arr[7], element.arr[8] ).applyMatrix3( _normalViewMatrix );

            _color.setRGB( _normal.x, _normal.y, _normal.z ).multiplyScalar( 0.5 ).addScalar( 0.5 );

         }

         if ( material.wireframe ) {

            _svgNode.setAttribute( 'style', 'fill: none; stroke: ' + _color.getStyle() + '; stroke-width: ' + material.wireframeLinewidth + '; stroke-opacity: ' + material.opacity + '; stroke-linecap: ' + material.wireframeLinecap + '; stroke-linejoin: ' + material.wireframeLinejoin );

         } else {

            _svgNode.setAttribute( 'style', 'fill: ' + _color.getStyle() + '; fill-opacity: ' + material.opacity );

         }

         _svg.appendChild( _svgNode );

      }

      function getLineNode( id ) {

         if ( _svgLinePool[ id ] == null ) {

            _svgLinePool[ id ] = document.createElementNS( 'http://www.w3.org/2000/svg', 'line' );

            if ( _quality == 0 ) {

               _svgLinePool[ id ].setAttribute( 'shape-rendering', 'crispEdges' ); //optimizeSpeed

            }

            return _svgLinePool[ id ];

         }

         return _svgLinePool[ id ];

      }

      function getPathNode( id ) {

         if ( _svgPathPool[ id ] == null ) {

            _svgPathPool[ id ] = document.createElementNS( 'http://www.w3.org/2000/svg', 'path' );

            if ( _quality == 0 ) {

               _svgPathPool[ id ].setAttribute( 'shape-rendering', 'crispEdges' ); //optimizeSpeed

            }

            return _svgPathPool[ id ];

         }

         return _svgPathPool[ id ];

      }

      function getRectNode( id ) {

         if ( _svgRectPool[ id ] == null ) {

            _svgRectPool[ id ] = document.createElementNS( 'http://www.w3.org/2000/svg', 'rect' );

            if ( _quality == 0 ) {

               _svgRectPool[ id ].setAttribute( 'shape-rendering', 'crispEdges' ); //optimizeSpeed

            }

            return _svgRectPool[ id ];

         }

         return _svgRectPool[ id ];

      }

   };



   // ===================================================================================================


   JSROOT.Painter.TestWebGL = function() {
      // return true if WebGL should be used
      /**
       * @author alteredq / http://alteredqualia.com/
       * @author mr.doob / http://mrdoob.com/
       */

      if (JSROOT.gStyle.NoWebGL) return false;

      if ('_Detect_WebGL' in this) return this._Detect_WebGL;

      try {
         var canvas = document.createElement( 'canvas' );
         this._Detect_WebGL = !! ( window.WebGLRenderingContext && ( canvas.getContext( 'webgl' ) || canvas.getContext( 'experimental-webgl' ) ) );
         //res = !!window.WebGLRenderingContext &&  !!document.createElement('canvas').getContext('experimental-webgl');
       } catch (e) {
           return false;
       }

       return this._Detect_WebGL;
   }

   JSROOT.Painter.TooltipFor3D = function(prnt, canvas) {
      this.tt = null;
      this.cont = null;
      this.lastlbl = '';
      this.parent = prnt ? prnt : document.body;
      this.canvas = canvas; // we need canvas to recalculate mouse events
      this.abspos = !prnt;

      this.check_parent = function(prnt) {
         if (prnt && (this.parent !== prnt)) {
            this.hide();
            this.parent = prnt;
         }
      }

      this.pos = function(e) {
         // method used to define position of next tooltip
         // event is delivered from canvas,
         // but position should be calculated relative to the element where tooltip is placed

         if (this.tt === null) return;
         var u,l;
         if (this.abspos) {
            l = JSROOT.browser.isIE ? (e.clientX + document.documentElement.scrollLeft) : e.pageX;
            u = JSROOT.browser.isIE ? (e.clientY + document.documentElement.scrollTop) : e.pageY;
         } else {

            l = e.offsetX;
            u = e.offsetY;

            var rect1 = this.parent.getBoundingClientRect(),
                rect2 = this.canvas.getBoundingClientRect();

            if ((rect1.left !== undefined) && (rect2.left!== undefined)) l += (rect2.left-rect1.left);

            if ((rect1.top !== undefined) && (rect2.top!== undefined)) u += rect2.top-rect1.top;

            if (l + this.tt.offsetWidth + 3 >= this.parent.offsetWidth)
               l = this.parent.offsetWidth - this.tt.offsetWidth - 3;

            if (u + this.tt.offsetHeight + 15 >= this.parent.offsetHeight)
               u = this.parent.offsetHeight - this.tt.offsetHeight - 15;

            // one should find parent with non-static position,
            // all absolute coordinates calculated relative to such node
            var abs_parent = this.parent;
            while (abs_parent) {
               var style = getComputedStyle(abs_parent);
               if (!style || (style.position !== 'static')) break;
               if (!abs_parent.parentNode || (abs_parent.parentNode.nodeType != 1)) break;
               abs_parent = abs_parent.parentNode;
            }

            if (abs_parent && (abs_parent !== this.parent)) {
               var rect0 = abs_parent.getBoundingClientRect();
               l+=(rect1.left - rect0.left);
               u+=(rect1.top - rect0.top);
            }

         }

         this.tt.style.top = (u + 15) + 'px';
         this.tt.style.left = (l + 3) + 'px';
      };

      this.show = function(v, mouse_pos, status_func) {
         // if (JSROOT.gStyle.Tooltip <= 0) return;
         if (!v || (v==="")) return this.hide();

         if (v && (typeof v =='object') && (v.lines || v.line)) {
            if (v.only_status) return this.hide();

            if (v.line) { v = v.line; } else {
               var res = v.lines[0];
               for (var n=1;n<v.lines.length;++n) res+= "<br/>" + v.lines[n];
               v = res;
            }
         }

         if (this.tt === null) {
            this.tt = document.createElement('div');
            this.tt.setAttribute('class', 'jsroot_tt3d_main');
            this.cont = document.createElement('div');
            this.cont.setAttribute('class', 'jsroot_tt3d_cont');
            this.tt.appendChild(this.cont);
            this.parent.appendChild(this.tt);
         }

         if (this.lastlbl !== v) {
            this.cont.innerHTML = v;
            this.lastlbl = v;
            this.tt.style.width = 'auto'; // let it be automatically resizing...
            if (JSROOT.browser.isIE)
               this.tt.style.width = this.tt.offsetWidth;
         }
      };

      this.hide = function() {
         if (this.tt !== null)
            this.parent.removeChild(this.tt);

         this.tt = null;
         this.lastlbl = "";
      }

      return this;
   }


   JSROOT.Painter.CreateOrbitControl = function(painter, camera, scene, renderer, lookat) {

      if (JSROOT.gStyle.Zooming && JSROOT.gStyle.ZoomWheel)
         renderer.domElement.addEventListener( 'wheel', control_mousewheel);

      if (JSROOT.gStyle.Zooming && JSROOT.gStyle.ZoomMouse) {
         renderer.domElement.addEventListener( 'mousedown', control_mousedown);
         renderer.domElement.addEventListener( 'mouseup', control_mouseup);
      }

      var control = new THREE.OrbitControls(camera, renderer.domElement);

      control.enableDamping = false;
      control.dampingFactor = 1.0;
      control.enableZoom = true;
      if (lookat) {
         control.target.copy(lookat);
         control.target0.copy(lookat);
         control.update();
      }

      control.tooltip = new JSROOT.Painter.TooltipFor3D(painter.select_main().node(), renderer.domElement);

      control.painter = painter;
      control.camera = camera;
      control.scene = scene;
      control.renderer = renderer;
      control.raycaster = new THREE.Raycaster();
      control.raycaster.linePrecision = 10;
      control.mouse_zoom_mesh = null; // zoom mesh, currently used in the zooming
      control.block_ctxt = false; // require to block context menu command appearing after control ends, required in chrome which inject contextmenu when key released
      control.block_mousemove = false; // when true, tooltip or cursor will not react on mouse move
      control.cursor_changed = false;
      control.control_changed = false;
      control.control_active = false;
      control.mouse_ctxt = { x:0, y: 0, on: false };

      control.Cleanup = function() {
         if (JSROOT.gStyle.Zooming && JSROOT.gStyle.ZoomWheel)
            this.domElement.removeEventListener( 'wheel', control_mousewheel);
         if (JSROOT.gStyle.Zooming && JSROOT.gStyle.ZoomMouse) {
            this.domElement.removeEventListener( 'mousedown', control_mousedown);
            this.domElement.removeEventListener( 'mouseup', control_mouseup);
         }

         this.domElement.removeEventListener('dblclick', this.lstn_dblclick);
         this.domElement.removeEventListener('contextmenu', this.lstn_contextmenu);
         this.domElement.removeEventListener('mousemove', this.lstn_mousemove);
         this.domElement.removeEventListener('mouseleave', this.lstn_mouseleave);

         this.dispose(); // this is from OrbitControl itself

         this.tooltip.hide();
         delete this.tooltip;
         delete this.painter;
         delete this.camera;
         delete this.scene;
         delete this.renderer;
         delete this.raycaster;
         delete this.mouse_zoom_mesh;
      }

      control.HideTooltip = function() {
         this.tooltip.hide();
      }

      control.GetMousePos = function(evnt, mouse) {
         mouse.x = ('offsetX' in evnt) ? evnt.offsetX : evnt.layerX;
         mouse.y = ('offsetY' in evnt) ? evnt.offsetY : evnt.layerY;
         mouse.clientX = evnt.clientX;
         mouse.clientY = evnt.clientY;
         return mouse;
      }

      control.GetIntersects = function(mouse) {
         // domElement gives correct coordinate with canvas render, but isn't always right for webgl renderer
         var sz = (this.renderer instanceof THREE.WebGLRenderer) ? this.renderer.getSize() : this.renderer.domElement;
         var pnt = { x: mouse.x / sz.width * 2 - 1, y: -mouse.y / sz.height * 2 + 1 };

         this.camera.updateMatrix();
         this.camera.updateMatrixWorld();
         this.raycaster.setFromCamera( pnt, this.camera );
         var intersects = this.raycaster.intersectObjects(this.scene.children, true);

         // painter may want to filter intersects
         if (typeof this.painter.FilterIntersects == 'function')
            intersects = this.painter.FilterIntersects(intersects);

         return intersects;
      }

      control.DetectZoomMesh = function(evnt) {
         var mouse = this.GetMousePos(evnt, {});
         var intersects = this.GetIntersects(mouse);
         if (intersects)
            for (var n=0;n<intersects.length;++n)
               if (intersects[n].object.zoom)
                  return intersects[n];

         return null;
      }

      control.ProcessDblClick = function(evnt) {
         var intersect = this.DetectZoomMesh(evnt);
         if (intersect && this.painter) {
            this.painter.Unzoom(intersect.object.use_y_for_z ? "y" : intersect.object.zoom);
         } else {
            this.reset();
         }
         // this.painter.Render3D();
      }


      control.ChangeEvent = function() {
         this.mouse_ctxt.on = false; // disable context menu if any changes where done by orbit control
         this.painter.Render3D(0);
         this.control_changed = true;
      }

      control.StartEvent = function() {
         this.control_active = true;
         this.block_ctxt = false;
         this.mouse_ctxt.on = false;

         this.tooltip.hide();

         // do not reset here, problem of events sequence in orbitcontrol
         // it issue change/start/stop event when do zooming
         // control.control_changed = false;
      }

      control.EndEvent = function() {
         this.control_active = false;
         if (this.mouse_ctxt.on) {
            this.mouse_ctxt.on = false;
            this.ContextMenu(this.mouse_ctxt, this.GetIntersects(this.mouse_ctxt));
         } else
         if (this.control_changed) {
            // react on camera change when required
         }
         this.control_changed = false;
      }

      control.MainProcessContextMenu = function(evnt) {
         evnt.preventDefault();
         this.GetMousePos(evnt, this.mouse_ctxt);
         if (this.control_active)
            this.mouse_ctxt.on = true;
         else
         if (this.block_ctxt)
            this.block_ctxt = false;
         else
            this.ContextMenu(this.mouse_ctxt, this.GetIntersects(this.mouse_ctxt));
      }

      control.ContextMenu = function(pos, intersects) {
         // do nothing, function called when context menu want to be activated
      }

      control.SwitchTooltip = function(on) {
         this.block_mousemove = !on;
         if (on===false) {
            this.tooltip.hide();
            this.RemoveZoomMesh();
         }
      }

      control.RemoveZoomMesh = function() {
         if (this.mouse_zoom_mesh && this.mouse_zoom_mesh.object.ShowSelection())
            this.painter.Render3D();
         this.mouse_zoom_mesh = null; // in any case clear mesh, enable orbit control again
      }

      control.MainProcessMouseMove = function(evnt) {
         if (this.control_active && evnt.buttons && (evnt.buttons & 2))
            this.block_ctxt = true; // if right button in control was active, block next context menu

         if (this.control_active || this.block_mousemove || !this.ProcessMouseMove) return;

         if (this.mouse_zoom_mesh) {
            // when working with zoom mesh, need special handling

            var zoom2 = this.DetectZoomMesh(evnt), pnt2 = null;

            if (zoom2 && (zoom2.object === this.mouse_zoom_mesh.object)) {
               pnt2 = zoom2.point;
            } else {
               pnt2 = this.mouse_zoom_mesh.object.GlobalIntersect(this.raycaster);
            }

            if (pnt2) this.mouse_zoom_mesh.point2 = pnt2;

            if (pnt2 && this.painter.enable_hightlight)
               if (this.mouse_zoom_mesh.object.ShowSelection(this.mouse_zoom_mesh.point, pnt2))
                  this.painter.Render3D(0);

            this.tooltip.hide();
            return;
         }

         evnt.preventDefault();

         var mouse = this.GetMousePos(evnt, {}),
             intersects = this.GetIntersects(mouse),
             tip = this.ProcessMouseMove(intersects),
             status_func = this.painter.GetShowStatusFunc();


         if (tip && status_func) {
            var name = "", title = "", coord = "", info = "";
            if (mouse) coord = mouse.x.toFixed(0)+ "," + mouse.y.toFixed(0);
            if (typeof tip == "string") info = tip; else {
               name = tip.name; title = tip.title;
               if (tip.line) info = tip.line; else
               if (tip.lines) { info = tip.lines.slice(1).join(' '); name = tip.lines[0]; }
            }
            status_func(name, title, info, coord);
         }

         this.cursor_changed = false;
         if (tip && this.painter.tooltip_allowed) {
            this.tooltip.check_parent(this.painter.select_main().node());

            this.tooltip.show(tip, mouse);
            this.tooltip.pos(evnt)
         } else {
            this.tooltip.hide();
            if (intersects)
               for (var n=0;n<intersects.length;++n)
                  if (intersects[n].object.zoom) this.cursor_changed = true;
         }

         document.body.style.cursor = this.cursor_changed ? 'pointer' : 'auto';
      };

      control.MainProcessMouseLeave = function() {
         this.tooltip.hide();
         if (typeof this.ProcessMouseLeave === 'function') this.ProcessMouseLeave();
         if (this.cursor_changed) {
            document.body.style.cursor = 'auto';
            this.cursor_changed = false;
         }
      };

      function control_mousewheel(evnt) {
         // try to handle zoom extra

         if (JSROOT.Painter.IsRender3DFired(control.painter) || control.mouse_zoom_mesh) {
            evnt.preventDefault();
            evnt.stopPropagation();
            evnt.stopImmediatePropagation();
            return; // already fired redraw, do not react on the mouse wheel
         }

         var intersect = control.DetectZoomMesh(evnt);
         if (!intersect) return;

         evnt.preventDefault();
         evnt.stopPropagation();
         evnt.stopImmediatePropagation();

         if (control.painter && (control.painter.AnalyzeMouseWheelEvent!==undefined)) {
            var kind = intersect.object.zoom,
                position = intersect.point[kind],
                item = { name: kind, ignore: false };

            // z changes from 0..2*size_z3d, others -size_xy3d..+size_xy3d
            if (kind!=="z") position = (position + control.painter.size_xy3d)/2/control.painter.size_xy3d;
                       else position = position/2/control.painter.size_z3d;

            control.painter.AnalyzeMouseWheelEvent(evnt, item, position, false);

            if ((kind==="z") && intersect.object.use_y_for_z) kind="y";

            control.painter.Zoom(kind, item.min, item.max);
         }
      }

      function control_mousedown(evnt) {
         // function used to hide some events from orbit control and redirect them to zooming rect

         if (control.mouse_zoom_mesh) {
            evnt.stopImmediatePropagation();
            evnt.stopPropagation();
            return;
         }

         // only left-button is considered
         if ((evnt.button!==undefined) && (evnt.button !==0)) return;
         if ((evnt.buttons!==undefined) && (evnt.buttons !== 1)) return;

         control.mouse_zoom_mesh = control.DetectZoomMesh(evnt);
         if (!control.mouse_zoom_mesh) return;

         // just block orbit control
         evnt.stopImmediatePropagation();
         evnt.stopPropagation();
      }

      function control_mouseup(evnt) {
         if (control.mouse_zoom_mesh && control.mouse_zoom_mesh.point2 && control.painter.Get3DZoomCoord) {

            var kind = control.mouse_zoom_mesh.object.zoom,
                pos1 = control.painter.Get3DZoomCoord(control.mouse_zoom_mesh.point, kind),
                pos2 = control.painter.Get3DZoomCoord(control.mouse_zoom_mesh.point2, kind);

            if (pos1>pos2) { var v = pos1; pos1 = pos2; pos2 = v; }

            if ((kind==="z") && control.mouse_zoom_mesh.object.use_y_for_z) kind="y";

            if ((kind==="z") && control.mouse_zoom_mesh.object.use_y_for_z) kind="y";

            // try to zoom
            if (pos1 < pos2)
              if (control.painter.Zoom(kind, pos1, pos2))
                 control.mouse_zoom_mesh = null;
         }

         // if selection was drawn, it should be removed and picture rendered again
         control.RemoveZoomMesh();
      }

      control.MainProcessDblClick = function(evnt) {
         this.ProcessDblClick(evnt);
      }

      control.addEventListener( 'change', control.ChangeEvent.bind(control));
      control.addEventListener( 'start', control.StartEvent.bind(control));
      control.addEventListener( 'end', control.EndEvent.bind(control));

      control.lstn_contextmenu = control.MainProcessContextMenu.bind(control);
      control.lstn_dblclick = control.MainProcessDblClick.bind(control);
      control.lstn_mousemove = control.MainProcessMouseMove.bind(control);
      control.lstn_mouseleave = control.MainProcessMouseLeave.bind(control);

      renderer.domElement.addEventListener('dblclick', control.lstn_dblclick);
      renderer.domElement.addEventListener('contextmenu', control.lstn_contextmenu);
      renderer.domElement.addEventListener('mousemove', control.lstn_mousemove);
      renderer.domElement.addEventListener('mouseleave', control.lstn_mouseleave);

      return control;
   }

   JSROOT.Painter.DisposeThreejsObject = function(obj, only_childs) {
      if (!obj) return;

      if (obj.children) {
         for (var i = 0; i < obj.children.length; i++)
            JSROOT.Painter.DisposeThreejsObject(obj.children[i]);
      }

      if (only_childs) {
         obj.children = [];
         return;
      }

      obj.children = undefined;

      if (obj.geometry) {
         obj.geometry.dispose();
         obj.geometry = undefined;
      }
      if (obj.material) {
         if (obj.material.map) {
            obj.material.map.dispose();
            obj.material.map = undefined;
         }
         obj.material.dispose();
         obj.material = undefined;
      }

      // cleanup jsroot fields to simplify browser cleanup job
      delete obj.painter;
      delete obj.bins_index;
      delete obj.tooltip;
      delete obj.stack; // used in geom painter

      obj = undefined;
   }

   JSROOT.Painter.HPainter_Create3DScene = function(arg) {

      if ((arg!==undefined) && (arg<0)) {

         if (typeof this.TestAxisVisibility === 'function')
            this.TestAxisVisibility(null, this.toplevel);

         this.clear_3d_canvas();

         JSROOT.Painter.DisposeThreejsObject(this.scene);
         if (this.control) this.control.Cleanup();

         if (this.renderer) {
            if (this.renderer.dispose) this.renderer.dispose();
            if (this.renderer.context) delete this.renderer.context;
         }

         delete this.size_xy3d;
         delete this.size_z3d;
         delete this.scene;
         delete this.toplevel;
         delete this.tooltip_mesh;
         delete this.camera;
         delete this.pointLight;
         delete this.renderer;
         delete this.control;
         if ('render_tmout' in this) {
            clearTimeout(this.render_tmout);
            delete this.render_tmout;
         }
         return;
      }

      if ('toplevel' in this) {
         // it is indication that all 3D object created, just replace it with empty
         this.scene.remove(this.toplevel);
         JSROOT.Painter.DisposeThreejsObject(this.toplevel);
         delete this.toplevel;
         delete this.tooltip_mesh;
         if (this.control) this.control.HideTooltip();

         var newtop = new THREE.Object3D();
         this.scene.add(newtop);
         this.toplevel = newtop;

         this.Resize3D(); // set actual sizes

         return;
      }

      this.usesvg = JSROOT.nodejs; // SVG used in batch mode

      var sz = this.size_for_3d(this.usesvg ? 3 : undefined);

      this.size_z3d = 100;
      this.size_xy3d = (sz.height > 10) && (sz.width > 10) ? Math.round(sz.width/sz.height*this.size_z3d) : this.size_z3d;

      // three.js 3D drawing
      this.scene = new THREE.Scene();
      //scene.fog = new THREE.Fog(0xffffff, 500, 3000);

      this.toplevel = new THREE.Object3D();
      this.scene.add(this.toplevel);
      this.scene_width = sz.width;
      this.scene_height = sz.height;

      this.camera = new THREE.PerspectiveCamera(45, this.scene_width / this.scene_height, 1, 40*this.size_z3d);

      var max3d = Math.max(0.75*this.size_xy3d, this.size_z3d);
      this.camera.position.set(-1.6*max3d, -3.5*max3d, 1.4*this.size_z3d);

      this.pointLight = new THREE.PointLight(0xffffff,1);
      this.camera.add( this.pointLight );
      this.pointLight.position.set( this.size_xy3d/2, this.size_xy3d/2, this.size_z3d/2 );

      var lookat = new THREE.Vector3(0,0,0.8*this.size_z3d);

      this.camera.up = new THREE.Vector3(0,0,1);
      this.camera.lookAt(lookat);
      this.scene.add( this.camera );

      if (this.usesvg) {
         this.renderer = new THREE.SVGRendererNew({ antialias: true, alpha: true });
      } else {
         this.webgl = JSROOT.Painter.TestWebGL();
         this.renderer = this.webgl ? new THREE.WebGLRenderer({ antialias : true, alpha: true }) :
                                      new THREE.CanvasRenderer({ antialias : true, alpha: true });
      }

      //renderer.setClearColor(0xffffff, 1);
      // renderer.setClearColor(0x0, 0);
      this.renderer.setSize(this.scene_width, this.scene_height);

      this.add_3d_canvas(sz, this.renderer.domElement);

      this.DrawXYZ = JSROOT.Painter.HPainter_DrawXYZ;
      this.Render3D = JSROOT.Painter.Render3D;
      this.Resize3D = JSROOT.Painter.Resize3D;
      this.BinHighlight3D = JSROOT.Painter.BinHighlight3D;

      this.first_render_tm = 0;
      this.enable_hightlight = false;
      this.tooltip_allowed = (JSROOT.gStyle.Tooltip > 0);

      if (JSROOT.nodejs) return;

      this.control = JSROOT.Painter.CreateOrbitControl(this, this.camera, this.scene, this.renderer, lookat);

      var painter = this;

      this.control.ProcessMouseMove = function(intersects) {
         var tip = null, mesh = null, zoom_mesh = null;

         for (var i = 0; i < intersects.length; ++i) {
            if (intersects[i].object.tooltip) {
               tip = intersects[i].object.tooltip(intersects[i]);
               if (tip) { mesh = intersects[i].object; break; }
            } else
            if (intersects[i].object.zoom && !zoom_mesh) zoom_mesh = intersects[i].object;
         }

         if (tip && !tip.use_itself) {
            var delta_xy = 1e-4*painter.size_xy3d, delta_z = 1e-4*painter.size_z3d;
            if ((tip.x1 > tip.x2) || (tip.y1 > tip.y2) || (tip.z1 > tip.z2)) console.warn('check 3D hints coordinates');
            tip.x1 -= delta_xy; tip.x2 += delta_xy;
            tip.y1 -= delta_xy; tip.y2 += delta_xy;
            tip.z1 -= delta_z; tip.z2 += delta_z;
         }

         painter.BinHighlight3D(tip, mesh);

         if (!tip && zoom_mesh && painter.Get3DZoomCoord) {
            var pnt = zoom_mesh.GlobalIntersect(this.raycaster),
                axis_name = zoom_mesh.zoom,
                axis_value = painter.Get3DZoomCoord(pnt, axis_name);

            if ((axis_name==="z") && zoom_mesh.use_y_for_z) axis_name = "y";

            var taxis = this.histo ? this.histo['f'+axis_name.toUpperCase()+"axis"] : null;

            var hint = { name: axis_name,
                         title: "TAxis",
                         line: "any info",
                         only_status: true};

            if (taxis) { hint.name = taxis.fName; hint.title = taxis.fTitle || "histogram TAxis object"; }

            hint.line = axis_name + " : " + painter.AxisAsText(axis_name, axis_value);

            return hint;
         }

         return (tip && tip.lines) ? tip : "";
      }

      this.control.ProcessMouseLeave = function() {
         painter.BinHighlight3D(null);
      }

      this.control.ContextMenu = function(pos, intersects) {
         var kind = "hist", p = painter;
         if (intersects)
            for (var n=0;n<intersects.length;++n) {
               var mesh = intersects[n].object;
               if (mesh.zoom) { kind = mesh.zoom; break; }
               if (mesh.painter && typeof mesh.painter.ShowContextMenu ==='function') {
                  p = mesh.painter; break;
               }
            }

         p.ShowContextMenu(kind, pos);
      }
   }

   JSROOT.Painter.HPainter_TestAxisVisibility = function(camera, toplevel, fb, bb) {
      var top;
      for (var n=0;n<toplevel.children.length;++n) {
         top = toplevel.children[n];
         if (top.axis_draw) break;
         top = undefined;
      }

      if (!top) return;

      if (!camera) {
         // this is case when axis drawing want to be removed
         toplevel.remove(top);
         delete this.TestAxisVisibility;
         return;
      }

      fb = fb ? true : false;
      bb = bb ? true : false;

      var qudrant = 1, pos = camera.position;
      if ((pos.x < 0) && (pos.y >= 0)) qudrant = 2;
      if ((pos.x >= 0) && (pos.y >= 0)) qudrant = 3;
      if ((pos.x >= 0) && (pos.y < 0)) qudrant = 4;

      function testvisible(id, range) {
         if (id <= qudrant) id+=4;
         return (id > qudrant) && (id < qudrant+range);
      }

      for (var n=0;n<top.children.length;++n) {
         var chld = top.children[n];
         if (chld.grid) chld.visible = bb && testvisible(chld.grid, 3); else
         if (chld.zid) chld.visible = testvisible(chld.zid, 2); else
         if (chld.xyid) chld.visible = testvisible(chld.xyid, 3); else
         if (chld.xyboxid) {
            var range = 5, shift = 0;
            if (bb && !fb) { range = 3; shift = -2; } else
            if (fb && !bb) range = 3; else
            if (!fb && !bb) range = (chld.bottom ? 3 : 0);
            chld.visible = testvisible(chld.xyboxid + shift, range);
            if (!chld.visible && chld.bottom && bb)
               chld.visible = testvisible(chld.xyboxid, 3);
         } else
         if (chld.zboxid) {
            var range = 2, shift = 0;
            if (fb && bb) range = 5; else
            if (bb && !fb) range = 4; else
            if (!bb && fb) { shift = -2; range = 4; }
            chld.visible = testvisible(chld.zboxid + shift, range);
         }
      }
   }

   JSROOT.Painter.HPainter_DrawXYZ = function(toplevel, opts) {
      if (!opts) opts = {};

      var grminx = -this.size_xy3d, grmaxx = this.size_xy3d,
          grminy = -this.size_xy3d, grmaxy = this.size_xy3d,
          grminz = 0, grmaxz = 2*this.size_z3d,
          textsize = Math.round(this.size_z3d * 0.05),
          pad = this.root_pad(),
          histo = this.histo,
          xmin = this.xmin, xmax = this.xmax,
          ymin = this.ymin, ymax = this.ymax,
          zmin = this.zmin, zmax = this.zmax,
          y_zoomed = false, z_zoomed = false;

      if (!this.size_z3d) {
         grminx = this.xmin; grmaxx = this.xmax;
         grminy = this.ymin; grmaxy = this.ymax;
         grminz = this.zmin; grmaxz = this.zmax;
         textsize = (grmaxz - grminz) * 0.05;
      }

      if (('zoom_xmin' in this) && ('zoom_xmax' in this) && (this.zoom_xmin !== this.zoom_xmax)) {
         xmin = this.zoom_xmin; xmax = this.zoom_xmax;
      }
      if (('zoom_ymin' in this) && ('zoom_ymax' in this) && (this.zoom_ymin !== this.zoom_ymax)) {
         ymin = this.zoom_ymin; ymax = this.zoom_ymax; y_zoomed = true;
      }

      if (('zoom_zmin' in this) && ('zoom_zmax' in this) && (this.zoom_zmin !== this.zoom_zmax)) {
         zmin = this.zoom_zmin; zmax = this.zoom_zmax; z_zoomed = true;
      }

      if (opts.use_y_for_z) {
         this.zmin = this.ymin; this.zmax = this.ymax;
         zmin = ymin; zmax = ymax; z_zoomed = y_zoomed;
         // if (!z_zoomed && (this.hmin!==this.hmax)) { zmin = this.hmin; zmax = this.hmax; }
         ymin = 0; ymax = 1;
      }

      // z axis range used for lego plot
      this.lego_zmin = zmin; this.lego_zmax = zmax;

      // factor 1.1 used in ROOT for lego plots
      if ((opts.zmult !== undefined) && !z_zoomed) zmax *= opts.zmult;

      this.TestAxisVisibility = JSROOT.Painter.HPainter_TestAxisVisibility;

      if (pad && pad.fLogx) {
         if (xmax <= 0) xmax = 1.;
         if ((xmin <= 0) && (this.nbinsx > 0))
            for (var i=0;i<this.nbinsx;++i) {
               xmin = Math.max(xmin, this.GetBinX(i));
               if (xmin>0) break;
            }
         if (xmin <= 0) xmin = 1e-4*xmax;
         this.grx = d3.scaleLog();
         this.x_kind = "log";
      } else {
         this.grx = d3.scaleLinear();
         if (histo && histo.fXaxis.fLabels) this.x_kind = "labels";
                                       else this.x_kind = "lin";
      }

      this.logx = (this.x_kind === "log");

      this.grx.domain([ xmin, xmax ]).range([ grminx, grmaxx ]);
      this.x_handle = new JSROOT.TAxisPainter(histo ? histo.fXaxis : null);
      this.x_handle.SetAxisConfig("xaxis", this.x_kind, this.grx, this.xmin, this.xmax, xmin, xmax);
      this.x_handle.CreateFormatFuncs();
      this.scale_xmin = xmin; this.scale_xmax = xmax;

      if (pad && pad.fLogy && !opts.use_y_for_z) {
         if (ymax <= 0) ymax = 1.;
         if ((ymin <= 0) && (this.nbinsy>0))
            for (var i=0;i<this.nbinsy;++i) {
               ymin = Math.max(ymin, this.GetBinY(i));
               if (ymin>0) break;
            }

         if (ymin <= 0) ymin = 1e-4*ymax;
         this.gry = d3.scaleLog();
         this.y_kind = "log";
      } else {
         this.gry = d3.scaleLinear();
         if (histo && histo.fYaxis.fLabels) this.y_kind = "labels";
                                       else this.y_kind = "lin";
      }

      this.logy = (this.y_kind === "log");

      this.gry.domain([ ymin, ymax ]).range([ grminy, grmaxy ]);
      this.y_handle = new JSROOT.TAxisPainter(histo ? histo.fYaxis : null);
      this.y_handle.SetAxisConfig("yaxis", this.y_kind, this.gry, this.ymin, this.ymax, ymin, ymax);
      this.y_handle.CreateFormatFuncs();
      this.scale_ymin = ymin; this.scale_ymax = ymax;

      if (pad && pad.fLogz) {
         if (zmax <= 0) zmax = 1;
         if (zmin <= 0) zmin = 1e-4*zmax;
         this.grz = d3.scaleLog();
         this.z_kind = "log";
      } else {
         this.grz = d3.scaleLinear();
         this.z_kind = "lin";
      }

      this.logz = (this.z_kind === "log");

      this.grz.domain([ zmin, zmax ]).range([ grminz, grmaxz ]);

      this.z_handle = new JSROOT.TAxisPainter(histo ? histo.fZaxis : null);
      this.z_handle.SetAxisConfig("zaxis", this.z_kind, this.grz, this.zmin, this.zmax, zmin, zmax);
      this.z_handle.CreateFormatFuncs();
      this.scale_zmin = zmin; this.scale_zmax = zmax;

      var textMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 }),
          lineMaterial = new THREE.LineBasicMaterial({ color: 0x000000 }),
          ticklen = textsize*0.5, text, tick, lbls = [], text_scale = 1,
          xticks = this.x_handle.CreateTicks(),
          yticks = this.y_handle.CreateTicks(),
          zticks = this.z_handle.CreateTicks();


      // main element, where all axis elements are placed
      var top = new THREE.Object3D();
      top.axis_draw = true; // mark element as axis drawing
      toplevel.add(top);

      var ticks = [], maxtextheight = 0;

      while (xticks.next()) {
         var grx = xticks.grpos;
         var is_major = (xticks.kind===1);
         var lbl = this.x_handle.format(xticks.tick, true, true);
         if (xticks.last_major()) lbl = "x"; else
            if (lbl === null) { is_major = false; lbl = ""; }


         if (is_major && lbl && (lbl.length>0)) {
            var text3d = new THREE.TextGeometry(lbl, { font: JSROOT.threejs_font_helvetiker_regular, size: textsize, height: 0, curveSegments: 5 });
            text3d.computeBoundingBox();
            var draw_width = text3d.boundingBox.max.x - text3d.boundingBox.min.x,
                draw_height = text3d.boundingBox.max.y - text3d.boundingBox.min.y;
            text3d.translate(-draw_width/2, 0, 0);

            maxtextheight = Math.max(maxtextheight, draw_height);

            text3d.grx = grx;
            lbls.push(text3d);

            if (!xticks.last_major()) {
               var space = (xticks.next_major_grpos() - grx);
               if (draw_width > 0)
                  text_scale = Math.min(text_scale, 0.9*space/draw_width)
               if (this.x_handle.IsCenterLabels()) text3d.grx += space/2;
            }
         }

         ticks.push(grx, 0, 0, grx, (is_major ? -ticklen : -ticklen * 0.6), 0);
      }

/*
      var ggg1 = new THREE.Geometry(), ggg2 = new THREE.Geometry();

      lbls.forEach(function(lbl) {
         var m = new THREE.Matrix4();
         // matrix to swap y and z scales and shift along z to its position
         m.set(text_scale, 0,           0,  lbl.grx,
               0,          text_scale,  0,  -maxtextheight*text_scale - 1.5*ticklen,
               0,          0,           1,  0);

         ggg1.merge(lbl, m);

         m.set(-text_scale, 0,           0, lbl.grx,
               0,           text_scale,  0, -maxtextheight*text_scale - 1.5*ticklen,
               0,           0,           1, 0);

         ggg2.merge(lbl, m);
      });
*/
      var ticksgeom = new THREE.BufferGeometry();
      ticksgeom.addAttribute( 'position', new THREE.BufferAttribute( new Float32Array(ticks), 3 ) );

      this.Get3DZoomCoord = function(point, kind) {
         // return axis coordinate from intersecetion point with axis geometry
         var pos = point[kind], min = this['scale_'+kind+'min'], max = this['scale_'+kind+'max'];

         if (kind==="z") pos = pos/2/this.size_z3d;
                   else  pos = (pos+this.size_xy3d)/2/this.size_xy3d;

         if (this["log"+kind]) {
            pos = Math.exp(Math.log(min) + pos*(Math.log(max)-Math.log(min)));
         } else {
            pos = min + pos*(max-min);
         }
         return pos;
      }

      function CreateZoomMesh(kind, size_3d, use_y_for_z) {
         var geom = new THREE.Geometry();

         if (kind==="z")
            geom.vertices.push(
                  new THREE.Vector3(0,0,0),
                  new THREE.Vector3(ticklen*4, 0, 0),
                  new THREE.Vector3(ticklen*4, 0, 2*size_3d),
                  new THREE.Vector3(0, 0, 2*size_3d));
         else
            geom.vertices.push(
                  new THREE.Vector3(-size_3d,0,0),
                  new THREE.Vector3(size_3d,0,0),
                  new THREE.Vector3(size_3d,-ticklen*4,0),
                  new THREE.Vector3(-size_3d,-ticklen*4,0));

         geom.faces.push(new THREE.Face3(0, 2, 1));
         geom.faces.push(new THREE.Face3(0, 3, 2));
         geom.computeFaceNormals();

         var material = new THREE.MeshBasicMaterial({ transparent: true,
                                   vertexColors: THREE.NoColors, //   THREE.FaceColors,
                                   side: THREE.DoubleSide,
                                   opacity: 0 });

         var mesh = new THREE.Mesh(geom, material);
         mesh.zoom = kind;
         mesh.size_3d = size_3d;
         mesh.use_y_for_z = use_y_for_z;
         if (kind=="y") mesh.rotateZ(Math.PI/2).rotateX(Math.PI);

         mesh.GlobalIntersect = function(raycaster) {
            var plane = new THREE.Plane(),
                geom = this.geometry;

            plane.setFromCoplanarPoints(geom.vertices[0], geom.vertices[1], geom.vertices[2]);
            plane.applyMatrix4(this.matrixWorld);

            var v1 = raycaster.ray.origin.clone(),
                v2 = v1.clone().addScaledVector(raycaster.ray.direction, 1e10);

            var pnt = plane.intersectLine(new THREE.Line3(v1,v2));

            if (!pnt) return undefined;

            var min = -this.size_3d, max = this.size_3d;
            if (this.zoom==="z") { min = 0; max = 2*this.size_3d; }

            if (pnt[this.zoom] < min) pnt[this.zoom] = min; else
            if (pnt[this.zoom] > max) pnt[this.zoom] = max;

            return pnt;
         }

         mesh.ShowSelection = function(pnt1,pnt2) {
            // used to show selection

            var tgtmesh = this.children[0], gg, kind = this.zoom;
            if (!pnt1 || !pnt2) {
               if (tgtmesh) {
                  this.remove(tgtmesh)
                  JSROOT.Painter.DisposeThreejsObject(tgtmesh);
               }
               return tgtmesh;
            }

            if (!tgtmesh) {
               gg = this.geometry.clone();
               if (kind==="z") gg.vertices[1].x = gg.vertices[2].x = ticklen;
                          else gg.vertices[2].y = gg.vertices[3].y = -ticklen;
               tgtmesh = new THREE.Mesh(gg, new THREE.MeshBasicMaterial({ color: 0xFF00, side: THREE.DoubleSide }));
               this.add(tgtmesh);
            } else {
               gg = tgtmesh.geometry;
            }

            if (kind=="z") {
               gg.vertices[0].z = gg.vertices[1].z = pnt1[kind];
               gg.vertices[2].z = gg.vertices[3].z = pnt2[kind];
            } else {
               gg.vertices[0].x = gg.vertices[3].x = pnt1[kind];
               gg.vertices[1].x = gg.vertices[2].x = pnt2[kind];
            }

            gg.computeFaceNormals();

            gg.verticesNeedUpdate = true;
            gg.normalsNeedUpdate = true;

            return true;
         }

         return mesh;
      }

      var xcont = new THREE.Object3D();
      xcont.position.set(0, grminy, grminz)
      xcont.rotation.x = 1/4*Math.PI;
      xcont.xyid = 2;
      xcont.add(new THREE.LineSegments(ticksgeom, lineMaterial));

      lbls.forEach(function(lbl) {
         var m = new THREE.Matrix4();
         // matrix to swap y and z scales and shift along z to its position
         m.set(text_scale, 0,           0,  lbl.grx,
               0,          text_scale,  0,  -maxtextheight*text_scale - 1.5*ticklen,
               0,          0,           1,  0,
               0,          0,           0,  1);

         var mesh = new THREE.Mesh(lbl, textMaterial);
         mesh.applyMatrix(m);
         xcont.add(mesh);
      });

      // xcont.add(new THREE.Mesh(ggg1, textMaterial));

      if (opts.zoom) xcont.add(CreateZoomMesh("x", this.size_xy3d));
      top.add(xcont);

      xcont = new THREE.Object3D();
      xcont.position.set(0, grmaxy, grminz);
      xcont.rotation.x = 3/4*Math.PI;
      xcont.add(new THREE.LineSegments(ticksgeom, lineMaterial));
      lbls.forEach(function(lbl) {
         var m = new THREE.Matrix4();
         // matrix to swap y and z scales and shift along z to its position
         m.set(-text_scale, 0,           0, lbl.grx,
               0,           text_scale,  0, -maxtextheight*text_scale - 1.5*ticklen,
               0,           0,           -1, 0,
               0,            0,           0, 1);
         var mesh = new THREE.Mesh(lbl, textMaterial);
         mesh.applyMatrix(m);
         xcont.add(mesh);
      });

      //xcont.add(new THREE.Mesh(ggg2, textMaterial));
      xcont.xyid = 4;
      if (opts.zoom) xcont.add(CreateZoomMesh("x", this.size_xy3d));
      top.add(xcont);

      lbls = []; text_scale = 1; maxtextheight = 0; ticks = [];

      while (yticks.next()) {
         var gry = yticks.grpos;
         var is_major = (yticks.kind===1);
         var lbl = this.y_handle.format(yticks.tick, true, true);
         if (yticks.last_major()) lbl = "y"; else
            if (lbl === null) { is_major = false; lbl = ""; }

         if (is_major) {
            var text3d = new THREE.TextGeometry(lbl, { font: JSROOT.threejs_font_helvetiker_regular, size: textsize, height: 0, curveSegments: 5 });
            text3d.computeBoundingBox();
            var draw_width = text3d.boundingBox.max.x - text3d.boundingBox.min.x,
                draw_height = text3d.boundingBox.max.y - text3d.boundingBox.min.y;
            text3d.translate(-draw_width/2, 0, 0);

            maxtextheight = Math.max(maxtextheight, draw_height);

            text3d.gry = gry;
            lbls.push(text3d);

            if (!yticks.last_major()) {
               var space = (yticks.next_major_grpos() - gry);
               if (draw_width > 0)
                  text_scale = Math.min(text_scale, 0.9*space/draw_width)
               if (this.y_handle.IsCenterLabels()) text3d.gry += space/2;
            }
         }
         ticks.push(0,gry,0, (is_major ? -ticklen : -ticklen*0.6), gry, 0);
      }

/*
      var ggg1 = new THREE.Geometry(), ggg2 = new THREE.Geometry();

      lbls.forEach(function(lbl) {
         var m = new THREE.Matrix4();
         m.set(0, text_scale,  0, -maxtextheight*text_scale - 1.5*ticklen,
               -text_scale,  0, 0, lbl.gry,
               0, 0,  1, 0);

         ggg1.merge(lbl, m);

         m.set(0, text_scale,  0, -maxtextheight*text_scale - 1.5*ticklen,
               text_scale,  0, 0, lbl.gry,
               0, 0,  1, 0);

         ggg2.merge(lbl, m);

      });

      ggg1 = new THREE.BufferGeometry().fromGeometry(ggg1);
      ggg2 = new THREE.BufferGeometry().fromGeometry(ggg2);
    */

      var ticksgeom = new THREE.BufferGeometry();
      ticksgeom.addAttribute( 'position', new THREE.BufferAttribute( new Float32Array(ticks), 3 ) );

      if (!opts.use_y_for_z) {
         var ycont = new THREE.Object3D();
         ycont.position.set(grminx, 0, grminz);
         ycont.rotation.y = -1/4*Math.PI;
         ycont.add(new THREE.LineSegments(ticksgeom, lineMaterial));
         //ycont.add(new THREE.Mesh(ggg1, textMaterial));

         lbls.forEach(function(lbl) {
            var m = new THREE.Matrix4();
            // matrix to swap y and z scales and shift along z to its position
            m.set(0, text_scale,  0, -maxtextheight*text_scale - 1.5*ticklen,
                  -text_scale,  0, 0, lbl.gry,
                  0, 0,  1, 0,
                  0, 0,  0, 1);

            var mesh = new THREE.Mesh(lbl, textMaterial);
            mesh.applyMatrix(m);
            ycont.add(mesh);
         });

         ycont.xyid = 3;
         if (opts.zoom) ycont.add(CreateZoomMesh("y", this.size_xy3d));
         top.add(ycont);

         ycont = new THREE.Object3D();
         ycont.position.set(grmaxx, 0, grminz);
         ycont.rotation.y = -3/4*Math.PI;
         ycont.add(new THREE.LineSegments(ticksgeom, lineMaterial));
         //ycont.add(new THREE.Mesh(ggg2, textMaterial));
         lbls.forEach(function(lbl) {
            var m = new THREE.Matrix4();
            m.set(0, text_scale, 0,  -maxtextheight*text_scale - 1.5*ticklen,
                  text_scale, 0, 0,  lbl.gry,
                  0,         0, -1,  0,
                  0, 0, 0, 1);

            var mesh = new THREE.Mesh(lbl, textMaterial);
            mesh.applyMatrix(m);
            ycont.add(mesh);
         });
         ycont.xyid = 1;
         if (opts.zoom) ycont.add(CreateZoomMesh("y", this.size_xy3d));
         top.add(ycont);
      }


      lbls = []; text_scale = 1;

      var ticks = []; // just array, will be used for the buffer geometry

      var zgridx = null, zgridy = null, lastmajorz = null;
      if (this.size_z3d) {
         zgridx = []; zgridy = [];
      }

      while (zticks.next()) {
         var grz = zticks.grpos;
         var is_major = zticks.kind == 1;

         var lbl = this.z_handle.format(zticks.tick, true, true);
         if (lbl === null) { is_major = false; lbl = ""; }

         if (is_major && lbl && (lbl.length > 0)) {
            var text3d = new THREE.TextGeometry(lbl, { font: JSROOT.threejs_font_helvetiker_regular, size : textsize, height : 0, curveSegments : 5 });
            text3d.computeBoundingBox();
            var draw_width = text3d.boundingBox.max.x - text3d.boundingBox.min.x,
                draw_height = text3d.boundingBox.max.y - text3d.boundingBox.min.y;
            text3d.translate(-draw_width, -draw_height/2, 0);
            text3d.grz = grz;
            lbls.push(text3d);

            if ((lastmajorz !== null) && (draw_height>0))
               text_scale = Math.min(text_scale, 0.9*(grz - lastmajorz)/draw_height);

            lastmajorz = grz;
         }

         // create grid
         if (zgridx && is_major)
            zgridx.push(grminx, 0, grz, grmaxx, 0, grz);

         if (zgridy && is_major)
            zgridy.push(0, grminy, grz, 0, grmaxy, grz);

         ticks.push(0, 0, grz, (is_major ? ticklen : ticklen * 0.6), 0, grz);
      }


      if (zgridx && (zgridx.length > 0)) {

         // var material = new THREE.LineBasicMaterial({ color: 0x0, linewidth: 0.5 });
         var material = new THREE.LineDashedMaterial( { color: 0x0, dashSize: 2, gapSize: 2 } );

         //var geom =  new THREE.BufferGeometry();
         //geom.addAttribute( 'position', new THREE.BufferAttribute( new Float32Array(zgridx), 3 ) );
         var geom =  new THREE.Geometry();
         for(i = 0; i < zgridx.length; i += 3 ){
            geom.vertices.push( new THREE.Vector3( zgridx[i], zgridx[i+1], zgridx[i+2]) );
         }
         geom.computeLineDistances();

         var lines = new THREE.LineSegments(geom, material);
         lines.position.set(0,grmaxy,0);
         lines.grid = 2; // mark as grid
         lines.visible = false;
         top.add(lines);

         lines = new THREE.LineSegments(geom, material);
         lines.position.set(0,grminy,0);
         lines.grid = 4; // mark as grid
         lines.visible = false;
         top.add(lines);
      }

      if (zgridy && (zgridy.length > 0)) {

         // var material = new THREE.LineBasicMaterial({ color: 0x0, linewidth: 0.5 });
         var material = new THREE.LineDashedMaterial( { color: 0x0, dashSize: 2, gapSize: 2  } );

         //var geom =  new THREE.BufferGeometry();
         //geom.addAttribute( 'position', new THREE.BufferAttribute( new Float32Array(zgridy), 3 ) );
         var geom =  new THREE.Geometry();
         for(i = 0; i < zgridy.length; i += 3 ){
            geom.vertices.push( new THREE.Vector3( zgridy[i], zgridy[i+1], zgridy[i+2]) );
         }
         geom.computeLineDistances();

         var lines = new THREE.LineSegments(geom, material);
         lines.position.set(grmaxx,0, 0);
         lines.grid = 3; // mark as grid
         lines.visible = false;
         top.add(lines);

         lines = new THREE.LineSegments(geom, material);
         lines.position.set(grminx, 0, 0);
         lines.grid = 1; // mark as grid
         lines.visible = false;
         top.add(lines);
      }


/*      var ggg = new THREE.Geometry();

      lbls.forEach(function(lbl) {
         var m = new THREE.Matrix4();
         // matrix to swap y and z scales and shift along z to its position
         m.set(-text_scale,          0,  0, 2*ticklen,
                        0,          0,  1, 0,
                        0, text_scale,  0, lbl.grz);

         ggg.merge(lbl, m);
      });

      ggg = new THREE.BufferGeometry().fromGeometry(ggg);
*/

      var ticksgeom = new THREE.BufferGeometry();
      ticksgeom.addAttribute( 'position', new THREE.BufferAttribute( new Float32Array(ticks), 3 ) );

      // ticks = new THREE.BufferGeometry().fromGeometry(ticks);

      var zcont = [];
      for (var n=0;n<4;++n) {
         zcont.push(new THREE.Object3D());
         //zcont[n].add(new THREE.Mesh(ggg, textMaterial));

         lbls.forEach(function(lbl) {
            var m = new THREE.Matrix4();
            // matrix to swap y and z scales and shift along z to its position
            m.set(-text_scale,          0,  0, 2*ticklen,
                            0,          0,  1, 0,
                            0, text_scale,  0, lbl.grz);
            var mesh = new THREE.Mesh(lbl, textMaterial);
            mesh.applyMatrix(m);
            zcont[n].add(mesh);
         });

         zcont[n].add(new THREE.LineSegments(ticksgeom, lineMaterial));
         if (opts.zoom) zcont[n].add(CreateZoomMesh("z", this.size_z3d, opts.use_y_for_z));

         zcont[n].zid = n + 2;
         top.add(zcont[n]);
      }

      zcont[0].position.set(grminx,grmaxy,0);
      zcont[0].rotation.z = 3/4*Math.PI;

      zcont[1].position.set(grmaxx,grmaxy,0);
      zcont[1].rotation.z = 1/4*Math.PI;

      zcont[2].position.set(grmaxx,grminy,0);
      zcont[2].rotation.z = -1/4*Math.PI;

      zcont[3].position.set(grminx,grminy,0);
      zcont[3].rotation.z = -3/4*Math.PI;


      // for TAxis3D do not show final cube
      if (this.size_z3d === 0) return;

      var linex = new THREE.BufferGeometry();
      linex.addAttribute( 'position', new THREE.BufferAttribute( new Float32Array([grminx, 0, 0, grmaxx, 0, 0]), 3 ) );
      for(var n=0;n<2;++n) {
         var line = new THREE.LineSegments(linex, lineMaterial);
         line.position.set(0, grminy, (n===0) ? grminz : grmaxz);
         line.xyboxid = 2; line.bottom = (n == 0);
         top.add(line);

         line = new THREE.LineSegments(linex, lineMaterial);
         line.position.set(0, grmaxy, (n===0) ? grminz : grmaxz);
         line.xyboxid = 4; line.bottom = (n == 0);
         top.add(line);
      }

      var liney = new THREE.BufferGeometry();
      liney.addAttribute( 'position', new THREE.BufferAttribute( new Float32Array([0, grminy,0, 0, grmaxy, 0]), 3 ) );
      for(var n=0;n<2;++n) {
         var line = new THREE.LineSegments(liney, lineMaterial);
         line.position.set(grminx, 0, (n===0) ? grminz : grmaxz);
         line.xyboxid = 3; line.bottom = (n == 0);
         top.add(line);

         line = new THREE.LineSegments(liney, lineMaterial);
         line.position.set(grmaxx, 0, (n===0) ? grminz : grmaxz);
         line.xyboxid = 1; line.bottom = (n == 0);
         top.add(line);
      }

      var linez = new THREE.BufferGeometry();
      linez.addAttribute( 'position', new THREE.BufferAttribute( new Float32Array([0, 0, grminz, 0, 0, grmaxz]), 3 ) );
      for(var n=0;n<4;++n) {
         var line = new THREE.LineSegments(linez, lineMaterial);
         line.zboxid = zcont[n].zid;
         line.position.copy(zcont[n].position);
         top.add(line);
      }
   }

   JSROOT.Painter.Box_Vertices = [
       new THREE.Vector3(1, 1, 1), new THREE.Vector3(1, 1, 0),
       new THREE.Vector3(1, 0, 1), new THREE.Vector3(1, 0, 0),
       new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 1, 1),
       new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 1)
   ];

   JSROOT.Painter.Box_Indexes = [ 0,2,1, 2,3,1, 4,6,5, 6,7,5, 4,5,1, 5,0,1, 7,6,2, 6,3,2, 5,7,0, 7,2,0, 1,3,4, 3,6,4 ];

   JSROOT.Painter.Box_Normals = [ 1,0,0, -1,0,0, 0,1,0, 0,-1,0, 0,0,1, 0,0,-1 ];

   // segments addresses Box_Vertices
   JSROOT.Painter.Box_Segments = [0, 2, 2, 7, 7, 5, 5, 0, 1, 3, 3, 6, 6, 4, 4, 1, 1, 0, 3, 2, 6, 7, 4, 5];

   // these segments address vertices from the mesh, we can use positions from box mesh
   JSROOT.Painter.Box_MeshSegments = (function() {
      var arr = new Int32Array(JSROOT.Painter.Box_Segments.length);
      for (var n=0;n<arr.length;++n) {
         for (var k=0;k<JSROOT.Painter.Box_Indexes.length;++k)
            if (JSROOT.Painter.Box_Segments[n] === JSROOT.Painter.Box_Indexes[k]) {
               arr[n] = k; break;
            }
      }
      return arr;
   })();

   JSROOT.Painter.BinHighlight3D = function(tip, selfmesh) {

      var changed = false, tooltip_mesh = null, changed_self = true,
          want_remove = !tip || (tip.x1===undefined) || !this.enable_hightlight;

      if (this.tooltip_selfmesh) {
         changed_self = (this.tooltip_selfmesh !== selfmesh)
         this.tooltip_selfmesh.material.color = this.tooltip_selfmesh.save_color;
         delete this.tooltip_selfmesh;
         changed = true;
      }

      if (this.tooltip_mesh) {
         tooltip_mesh = this.tooltip_mesh;
         this.toplevel.remove(this.tooltip_mesh);
         delete this.tooltip_mesh;
         changed = true;
      }

      if (want_remove) {
         if (changed) this.Render3D();
         this.ProvideUserTooltip(null);
         return;
      }

      if (tip.use_itself) {
         selfmesh.save_color = selfmesh.material.color;
         selfmesh.material.color = new THREE.Color(tip.color);
         this.tooltip_selfmesh = selfmesh;
         changed = changed_self;
      } else {
         changed = true;

         var indicies = JSROOT.Painter.Box_Indexes,
             normals = JSROOT.Painter.Box_Normals,
             vertices = JSROOT.Painter.Box_Vertices,
             pos, norm,
             color = new THREE.Color(tip.color ? tip.color : 0xFF0000),
             opacity = tip.opacity || 1;

         if (!tooltip_mesh) {
            pos = new Float32Array(indicies.length*3);
            norm = new Float32Array(indicies.length*3);
            var geom = new THREE.BufferGeometry();
            geom.addAttribute( 'position', new THREE.BufferAttribute( pos, 3 ) );
            geom.addAttribute( 'normal', new THREE.BufferAttribute( norm, 3 ) );
            var mater = new THREE.MeshBasicMaterial( { color: color, opacity: opacity, shading: THREE.SmoothShading  } );
            tooltip_mesh = new THREE.Mesh(geom, mater);
         } else {
            pos = tooltip_mesh.geometry.attributes.position.array;
            tooltip_mesh.geometry.attributes.position.needsUpdate = true;
            tooltip_mesh.material.color = color;
            tooltip_mesh.material.opacity = opacity;
         }

         if (tip.x1 === tip.x2) console.warn('same tip X', tip.x1, tip.x2);
         if (tip.y1 === tip.y2) console.warn('same tip Y', tip.y1, tip.y2);
         if (tip.z1 === tip.z2) { tip.z2 = tip.z1 + 0.0001; } // avoid zero faces

         for (var k=0,nn=-3;k<indicies.length;++k) {
            var vert = vertices[indicies[k]];
            pos[k*3]   = tip.x1 + vert.x * (tip.x2 - tip.x1);
            pos[k*3+1] = tip.y1 + vert.y * (tip.y2 - tip.y1);
            pos[k*3+2] = tip.z1 + vert.z * (tip.z2 - tip.z1);

            if (norm) {
               if (k%6===0) nn+=3;
               norm[k*3] = normals[nn];
               norm[k*3+1] = normals[nn+1];
               norm[k*3+2] = normals[nn+2];
            }
         }
         this.tooltip_mesh = tooltip_mesh;
         this.toplevel.add(tooltip_mesh);
      }

      if (changed) this.Render3D();

      if (this.IsUserTooltipCallback() && this.GetObject()) {
         this.ProvideUserTooltip({ obj: this.GetObject(),  name: this.GetObject().fName,
                                   bin: tip.bin, cont: tip.value,
                                   binx: tip.ix, biny: tip.iy, binz: tip.iz,
                                   grx: (tip.x1+tip.x2)/2, gry: (tip.y1+tip.y2)/2, grz: (tip.z1+tip.z2)/2 });
      }
   }

   JSROOT.Painter.HistPainter_DrawTH2Error = function() {
      var pthis = this,
          main = this.main_painter(),
          handle = main.PrepareColorDraw({ rounding: false, use3d: true, extra: 1 }),
          zmin = main.grz.domain()[0],
          zmax = main.grz.domain()[1],
          i, j, bin, binz, binerr, x1, y1, x2, y2, z1, z2,
          nsegments = 0, lpos = null, binindx = null, lindx = 0;

       function check_skip_min() {
          // return true if minimal histogram value should be skipped
          if (pthis.options.Zero || (zmin>0)) return false;
          return !pthis._show_empty_bins;
       }

       for (var loop=0;loop<2;++loop) {

          for (i=handle.i1;i<handle.i2;++i) {
             x1 = handle.grx[i];
             x2 = handle.grx[i+1];
             for (j=handle.j1;j<handle.j2;++j) {
                binz = this.histo.getBinContent(i+1, j+1);
                if ((binz < zmin) || (binz > zmax)) continue;
                if ((binz===zmin) && check_skip_min()) continue;

                // just count number of segments
                if (loop===0) { nsegments+=3; continue; }

                bin = this.histo.getBin(i+1,j+1);
                binerr = this.histo.getBinError(bin);
                binindx[lindx/18] = bin;

                y1 = handle.gry[j];
                y2 = handle.gry[j+1];

                z1 = main.grz((binz - binerr < zmin) ? zmin : binz-binerr);
                z2 = main.grz((binz + binerr > zmax) ? zmax : binz+binerr);

                lpos[lindx] = x1; lpos[lindx+3] = x2;
                lpos[lindx+1] = lpos[lindx+4] = (y1+y2)/2;
                lpos[lindx+2] = lpos[lindx+5] = (z1+z2)/2;
                lindx+=6;

                lpos[lindx] = lpos[lindx+3] = (x1+x2)/2;
                lpos[lindx+1] = y1; lpos[lindx+4] = y2;
                lpos[lindx+2] = lpos[lindx+5] = (z1+z2)/2;
                lindx+=6;

                lpos[lindx] = lpos[lindx+3] = (x1+x2)/2;
                lpos[lindx+1] = lpos[lindx+4] = (y1+y2)/2;
                lpos[lindx+2] = z1; lpos[lindx+5] = z2;
                lindx+=6;
             }
          }

          if (loop===0) {
             if (nsegments===0) return;
             lpos = new Float32Array(nsegments*6);
             binindx = new Int32Array(nsegments/3);
          }
       }

       // create boxes
       var geometry = new THREE.BufferGeometry();
       geometry.addAttribute( 'position', new THREE.BufferAttribute( lpos, 3 ) );

       var lcolor = JSROOT.Painter.root_colors[this.GetObject().fLineColor];

       var material = new THREE.LineBasicMaterial({ color: new THREE.Color(lcolor) });
       if (!JSROOT.browser.isIE) material.linewidth = this.GetObject().fLineWidth;
       var line = new THREE.LineSegments(geometry, material);

       line.painter = this;
       line.intersect_index = binindx;
       line.zmin = zmin;
       line.zmax = zmax;
       line.tip_color = (this.GetObject().fLineColor===3) ? 0xFF0000 : 0x00FF00;

       line.tooltip = function(intersect) {
          var pos = Math.floor(intersect.index / 6);
          if ((pos<0) || (pos >= this.intersect_index.length)) return null;
          var p = this.painter,
              main = p.main_painter(),
              tip = p.Get3DToolTip(this.intersect_index[pos]);

          tip.x1 = Math.max(-main.size_xy3d, main.grx(p.GetBinX(tip.ix-1)));
          tip.x2 = Math.min(main.size_xy3d, main.grx(p.GetBinX(tip.ix)));
          tip.y1 = Math.max(-main.size_xy3d, main.gry(p.GetBinY(tip.iy-1)));
          tip.y2 = Math.min(main.size_xy3d, main.gry(p.GetBinY(tip.iy)));

          tip.z1 = main.grz(tip.value-tip.error < this.zmin ? this.zmin : tip.value-tip.error);
          tip.z2 = main.grz(tip.value+tip.error > this.zmax ? this.zmax : tip.value+tip.error);

          tip.color = this.tip_color;

          return tip;
       }

       this.toplevel.add(line);
   }


   JSROOT.Painter.HistPainter_DrawLego = function() {

      if (!this.draw_content) return;

      if (this.IsTH2Poly())
         return JSROOT.Painter.HistPainter_DrawPolyLego.call(this);

      if (this.options.Contour && (this.Dimension()==2))
         return JSROOT.Painter.HistPainter_DrawContour3D.call(this, true);

      if (this.options.Surf && (this.Dimension()==2))
         return JSROOT.Painter.HistPainter_DrawTH2Surf.call(this);

      if (this.options.Error && (this.Dimension()==2))
         return JSROOT.Painter.HistPainter_DrawTH2Error.call(this);

      // Perform TH1/TH2 lego plot with BufferGeometry

      var vertices = JSROOT.Painter.Box_Vertices,
          indicies = JSROOT.Painter.Box_Indexes,
          vnormals = JSROOT.Painter.Box_Normals,
          segments = JSROOT.Painter.Box_Segments,
          // reduced line segments
          rsegments = [0, 1, 1, 2, 2, 3, 3, 0],
          // reduced vertices
          rvertices = [ new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 1, 0), new THREE.Vector3(1, 1, 0), new THREE.Vector3(1, 0, 0) ],
          main = this.main_painter(),
          axis_zmin = main.grz.domain()[0],
          axis_zmax = main.grz.domain()[1],
          handle = main.PrepareColorDraw({ rounding: false, use3d: true, extra: 1 }),
          i1 = handle.i1, i2 = handle.i2, j1 = handle.j1, j2 = handle.j2,
          i, j, x1, x2, y1, y2, binz1, binz2, reduced, nobottom, notop,
          pthis = this,
          histo = this.GetObject(),
          basehisto = histo ? histo['$baseh'] : null,
          split_faces = (this.options.Lego === 11) || (this.options.Lego === 13); // split each layer on two parts

      if ((i1 >= i2) || (j1 >= j2)) return;

      function GetBinContent(ii,jj, level) {
         // return bin content in binz1, binz2, reduced flags
         // return true if bin should be displayed

         binz2 = histo.getBinContent(ii+1, jj+1);
         if (basehisto)
            binz1 = basehisto.getBinContent(ii+1, jj+1);
         else if (pthis.options.BaseLine !== false)
            binz1 = pthis.options.BaseLine;
         else
            binz1 = pthis.options.Zero ? axis_zmin : 0;
         if (binz2 < binz1) { var d = binz1; binz1 = binz2; binz2 = d; }

         if ((binz1 >= zmax) || (binz2 < zmin)) return false;

         reduced = (binz2 === zmin) || (binz1 >= binz2);

         if (!reduced || (level>0)) return true;

         if (histo['$baseh']) return false; // do not draw empty bins on top of other bins

         if (pthis.options.Zero || (axis_zmin>0)) return true;

         return pthis._show_empty_bins;
      }

      // if bin ID fit into 16 bit, use smaller arrays for intersect indexes
      var use16indx = (this.histo.getBin(i2, j2) < 0xFFFF),
          levels = [ axis_zmin, axis_zmax ], palette = null, totalvertices = 0;

      // DRAW ALL CUBES

      if ((this.options.Lego === 12) || (this.options.Lego === 14)) {
         levels = this.CreateContour(this.histo.fContour ? this.histo.fContour.length : 20, this.lego_zmin, this.lego_zmax);
         palette = this.GetPalette();
      }

      for (var nlevel=0; nlevel<levels.length-1;++nlevel) {

         var zmin = levels[nlevel], zmax = levels[nlevel+1],
             z1 = 0, z2 = 0, grzmin = main.grz(zmin), grzmax = main.grz(zmax),
             numvertices = 0, num2vertices = 0;

         // now calculate size of buffer geometry for boxes

         for (i=i1;i<i2;++i)
            for (j=j1;j<j2;++j) {

               if (!GetBinContent(i,j,nlevel)) continue;

               nobottom = !reduced && (nlevel>0);
               notop = !reduced && (binz2 > zmax) && (nlevel < levels.length-2);

               numvertices += (reduced ? 12 : indicies.length);
               if (nobottom) numvertices -= 6;
               if (notop) numvertices -= 6;

               if (split_faces && !reduced) {
                  numvertices -= 12;
                  num2vertices += 12;
               }
            }

         totalvertices += numvertices + num2vertices;

         var positions = new Float32Array(numvertices*3),
             normals = new Float32Array(numvertices*3),
             bins_index = use16indx ? new Uint16Array(numvertices) : new Uint32Array(numvertices),
             pos2 = null, norm2 = null, indx2 = null,
             v = 0, v2 = 0, vert, bin, k, nn;

         if (num2vertices > 0) {
            pos2 = new Float32Array(num2vertices*3);
            norm2 = new Float32Array(num2vertices*3);
            indx2 = use16indx ? new Uint16Array(num2vertices) : new Uint32Array(num2vertices);
         }

         for (i=i1;i<i2;++i) {
            x1 = handle.grx[i];
            x2 = handle.grx[i+1];
            for (j=j1;j<j2;++j) {

               if (!GetBinContent(i,j,nlevel)) continue;

               nobottom = !reduced && (nlevel>0);
               notop = !reduced && (binz2 > zmax) && (nlevel < levels.length-2);

               y1 = handle.gry[j];
               y2 = handle.gry[j+1];

               z1 = (binz1 <= zmin) ? grzmin : main.grz(binz1);
               z2 = (binz2 > zmax) ? grzmax : main.grz(binz2);

               nn = 0; // counter over the normals, each normals correspond to 6 vertices
               k = 0; // counter over vertices

               if (reduced) {
                  // we skip all side faces, keep only top and bottom
                  nn += 12;
                  k += 24;
               }

               var size = indicies.length, bin_index = this.histo.getBin(i+1, j+1);
               if (nobottom) size -= 6;

               // array over all vertices of the single bin
               while(k < size) {

                  vert = vertices[indicies[k]];

                  if (split_faces && (k < 12)) {
                     pos2[v2]   = x1 + vert.x * (x2 - x1);
                     pos2[v2+1] = y1 + vert.y * (y2 - y1);
                     pos2[v2+2] = z1 + vert.z * (z2 - z1);

                     norm2[v2] = vnormals[nn];
                     norm2[v2+1] = vnormals[nn+1];
                     norm2[v2+2] = vnormals[nn+2];

                     indx2[v2/3] = bin_index; // remember which bin corresponds to the vertex
                     v2+=3;
                  } else {
                     positions[v]   = x1 + vert.x * (x2 - x1);
                     positions[v+1] = y1 + vert.y * (y2 - y1);
                     positions[v+2] = z1 + vert.z * (z2 - z1);

                     normals[v] = vnormals[nn];
                     normals[v+1] = vnormals[nn+1];
                     normals[v+2] = vnormals[nn+2];
                     bins_index[v/3] = bin_index; // remember which bin corresponds to the vertex
                     v+=3;
                  }

                  ++k;

                  if (k%6 === 0) {
                     nn+=3;
                     if (notop && (k === indicies.length - 12)) {
                        k+=6; nn+=3; // jump over notop indexes
                     }
                  }
               }
            }
         }

         var geometry = new THREE.BufferGeometry();
         geometry.addAttribute( 'position', new THREE.BufferAttribute( positions, 3 ) );
         geometry.addAttribute( 'normal', new THREE.BufferAttribute( normals, 3 ) );
         // geometry.computeVertexNormals();

         var rootcolor = histo.fFillColor,
             fcolor = JSROOT.Painter.root_colors[rootcolor];

         if (palette) {
            var indx = Math.floor((nlevel+0.99)*palette.length/(levels.length-1));
            if (indx > palette.length-1) indx = palette.length-1;
            fcolor = palette[indx];
         } else {
            if ((this.options.Lego === 1) || (rootcolor < 2)) {
               rootcolor = 1;
               fcolor = 'white';
            }
         }

         //var material = new THREE.MeshLambertMaterial( { color: fcolor } );
         var material = new THREE.MeshBasicMaterial( { color: fcolor, shading: THREE.SmoothShading  } );

         var mesh = new THREE.Mesh(geometry, material);

         mesh.bins_index = bins_index;
         mesh.painter = this;
         mesh.zmin = axis_zmin;
         mesh.zmax = axis_zmax;
         mesh.baseline = (this.options.BaseLine===false) ? axis_zmin : this.options.BaseLine;
         mesh.tip_color = (rootcolor===3) ? 0xFF0000 : 0x00FF00;

         mesh.tooltip = function(intersect) {
            if ((intersect.index<0) || (intersect.index >= this.bins_index.length)) return null;
            var p = this.painter,
                main = p.main_painter(),
                hist = p.GetObject(),
                tip = p.Get3DToolTip( this.bins_index[intersect.index] );

            tip.x1 = Math.max(-main.size_xy3d, main.grx(p.GetBinX(tip.ix-1)));
            tip.x2 = Math.min(main.size_xy3d, main.grx(p.GetBinX(tip.ix)));
            if (p.Dimension()===1) {
               tip.y1 = main.gry(0);
               tip.y2 = main.gry(1);
            } else {
               tip.y1 = Math.max(-main.size_xy3d, main.gry(p.GetBinY(tip.iy-1)));
               tip.y2 = Math.min(main.size_xy3d, main.gry(p.GetBinY(tip.iy)));
            }

            var binz1 = this.baseline, binz2 = tip.value;
            if (hist['$baseh']) binz1 = hist['$baseh'].getBinContent(tip.ix, tip.iy);
            if (binz2<binz1) { var v = binz1; binz1 = binz2; binz2 = v; }

            tip.z1 = main.grz(Math.max(this.zmin,binz1));
            tip.z2 = main.grz(Math.min(this.zmax,binz2));

            tip.color = this.tip_color;

            return tip;
         }

         main.toplevel.add(mesh);

         if (num2vertices > 0) {
            var geom2 = new THREE.BufferGeometry();
            geom2.addAttribute( 'position', new THREE.BufferAttribute( pos2, 3 ) );
            geom2.addAttribute( 'normal', new THREE.BufferAttribute( norm2, 3 ) );
            //geom2.computeVertexNormals();

            //var material2 = new THREE.MeshLambertMaterial( { color: 0xFF0000 } );

            var color2 = (rootcolor<2) ? new THREE.Color(0xFF0000) :
                            new THREE.Color(d3.rgb(fcolor).darker(0.5).toString());

            var material2 = new THREE.MeshBasicMaterial( { color: color2, shading: THREE.SmoothShading } );

            var mesh2 = new THREE.Mesh(geom2, material2);
            mesh2.bins_index = indx2;
            mesh2.painter = this;
            mesh2.tooltip = mesh.tooltip;
            mesh2.zmin = mesh.zmin;
            mesh2.zmax = mesh.zmax;
            mesh2.baseline = mesh.baseline;
            mesh2.tip_color = mesh.tip_color;

            main.toplevel.add(mesh2);
         }
      }

      // lego3 or lego4 do not draw border lines
      if (this.options.Lego > 12) return;

      // DRAW LINE BOXES

      var numlinevertices = 0, numsegments = 0, uselineindx = true, nskip = 0;

      zmax = axis_zmax; zmin = axis_zmin;

      for (i=i1;i<i2;++i)
         for (j=j1;j<j2;++j) {
            if (!GetBinContent(i,j,0)) { nskip++; continue; }

            // calculate required buffer size for line segments
            numlinevertices += (reduced ? rvertices.length : vertices.length);
            numsegments += (reduced ? rsegments.length : segments.length);
         }

      // On some platforms vertex index required to be Uint16 array
      // While we cannot use index for large vertex list
      // skip index usage at all. It happens for relatively large histograms (100x100 bins)
      if (numlinevertices > 0xFFF0) uselineindx = false;

      if (!uselineindx) numlinevertices = numsegments*3;

      var lpositions = new Float32Array( numlinevertices * 3 ),
          lindicies = uselineindx ? new Uint16Array( numsegments ) : null;
//          intersect_size = uselineindx ? numsegments : numlinevertices,
//          intersect_index = use16indx ? new Uint16Array( intersect_size ) : new Uint32Array( intersect_size );

      var z1 = 0, z2 = 0,
          grzmin = main.grz(axis_zmin),
          grzmax = main.grz(axis_zmax),
          ll = 0, ii = 0;

      for (i=i1;i<i2;++i) {
         x1 = handle.grx[i];
         x2 = handle.grx[i+1];
         for (j=j1;j<j2;++j) {

            if (!GetBinContent(i,j,0)) continue;

            y1 = handle.gry[j];
            y2 = handle.gry[j+1];

            z1 = (binz1 <= axis_zmin) ? grzmin : main.grz(binz1);
            z2 = (binz2 > axis_zmax) ? grzmax : main.grz(binz2);

            var seg = reduced ? rsegments : segments,
                vvv = reduced ? rvertices : vertices;

            if (uselineindx) {
               // array of indicies for the lines, to avoid duplication of points
               for (k=0; k < seg.length; ++k) {
//                  intersect_index[ii] = bin_index;
                  lindicies[ii++] = ll/3 + seg[k];
               }

               for (k=0; k < vvv.length; ++k) {
                  vert = vvv[k];
                  lpositions[ll]   = x1 + vert.x * (x2 - x1);
                  lpositions[ll+1] = y1 + vert.y * (y2 - y1);
                  lpositions[ll+2] = z1 + vert.z * (z2 - z1);
                  ll+=3;
               }
            } else {
               // copy only vertex positions
               for (k=0; k < seg.length; ++k) {
                  vert = vvv[seg[k]];
                  lpositions[ll]   = x1 + vert.x * (x2 - x1);
                  lpositions[ll+1] = y1 + vert.y * (y2 - y1);
                  lpositions[ll+2] = z1 + vert.z * (z2 - z1);
//                  intersect_index[ll/3] = bin_index;
                  ll+=3;
               }
            }
         }
      }

      // create boxes
      geometry = new THREE.BufferGeometry();
      geometry.addAttribute( 'position', new THREE.BufferAttribute( lpositions, 3 ) );
      if (uselineindx)
         geometry.setIndex(new THREE.BufferAttribute(lindicies, 1));

      var lcolor = JSROOT.Painter.root_colors[histo.fLineColor];

      material = new THREE.LineBasicMaterial({ color: new THREE.Color(lcolor) });
      if (!JSROOT.browser.isIE) material.linewidth = histo.fLineWidth;
      var line = new THREE.LineSegments(geometry, material);

      /*
      line.painter = this;
      line.intersect_index = intersect_index;
      line.tooltip = function(intersect) {
         if ((intersect.index<0) || (intersect.index >= this.intersect_index.length)) return null;
         return this.painter.Get3DToolTip(this.intersect_index[intersect.index]);
      }
      */

      main.toplevel.add(line);
   }

   JSROOT.Painter.HistPainter_DrawContour3D = function(realz) {
      // for contour plots one requires handle with full range
      var main = this.main_painter(),
          handle = this.PrepareColorDraw({rounding: false, use3d: true, extra: 100, middle: 0.0 });

      this.getContourIndex(0);

      // get levels
      var histo = this.GetObject(),
          levels = this.fContour,
          palette = this.GetPalette(),
          painter = this,
          layerz = 2*main.size_z3d;

      this.BuildContour(handle, levels, palette,
         function(colindx,xp,yp,iminus,iplus,ilevel) {
             // ignore less than three points
             if (iplus - iminus < 3) return;

             if (realz) {
                layerz = main.grz(levels[ilevel]);
                if ((layerz < 0) || (layerz > 2*main.size_z3d)) return;
             }

             var linepos = new Float32Array((iplus-iminus+1)*3), indx = 0;
             for (var i=iminus;i<=iplus;++i) {
                linepos[indx] = xp[i];
                linepos[indx+1] = yp[i];
                linepos[indx+2] = layerz;
                indx+=3;
             }

             var geometry = new THREE.BufferGeometry();
             geometry.addAttribute( 'position', new THREE.BufferAttribute( linepos, 3 ) );

             var material = new THREE.LineBasicMaterial({ color: new THREE.Color(JSROOT.Painter.root_colors[histo.fLineColor]) });

             var line = new THREE.Line(geometry, material);
             main.toplevel.add(line);
         }
      );

   }

   JSROOT.Painter.HistPainter_DrawTH2Surf = function() {
      var histo = this.GetObject(),
          main = this.main_painter(),
          handle = main.PrepareColorDraw({rounding: false, use3d: true, extra: 1, middle: 0.5 }),
          i,j, x1, y1, x2, y2, z11, z12, z21, z22,
          axis_zmin = main.grz.domain()[0],
          axis_zmax = main.grz.domain()[1];

      // first adjust ranges

      var main_grz = !main.logz ? main.grz : function(value) { return value < axis_zmin ? -0.1 : main.grz(value); }

      if ((handle.i2 - handle.i1 < 2) || (handle.j2 - handle.j1 < 2)) return;

      var ilevels = null, levels = null, dolines = true, docolorfaces = false, dogrid = false,
          donormals = false;

      switch(this.options.Surf) {
         case 11: ilevels = this.GetContour(); docolorfaces = true; break;
         case 12:
         case 15: // make surf5 same as surf2
         case 17: ilevels = this.GetContour(); docolorfaces = true; dolines = false; break;
         case 14: dolines = false; donormals = true; break;
         case 16: ilevels = this.GetContour(); dogrid = true; dolines = false; break;
         default: ilevels = main.z_handle.CreateTicks(true); dogrid = true; break;
      }

      if (ilevels) {
         // recalculate levels into graphical coordinates
         levels = new Float32Array(ilevels.length);
         for (var ll=0;ll<ilevels.length;++ll)
            levels[ll] = main_grz(ilevels[ll]);
      } else {
         levels = [0, 2*main.size_z3d]; // just cut top/bottom parts
      }

      var loop, nfaces = [], pos = [], indx = [],    // buffers for faces
          nsegments = 0, lpos = null, lindx = 0,     // buffer for lines
          ngridsegments = 0, grid = null, gindx = 0, // buffer for grid lines segments
          normindx = null;                           // buffer to remember place of vertex for each bin

      function CheckSide(z,level1, level2) {
         if (z<level1) return -1;
         if (z>level2) return 1;
         return 0;
      }

      function AddLineSegment(x1,y1,z1, x2,y2,z2) {
         if (!dolines) return;
         var side1 = CheckSide(z1,0,2*main.size_z3d),
             side2 = CheckSide(z2,0,2*main.size_z3d);
         if ((side1===side2) && (side1!==0)) return;
         if (!loop) return ++nsegments;

         if (side1!==0) {
            var diff = z2-z1;
            z1 = (side1<0) ? 0 : 2*main.size_z3d;
            x1 = x2 - (x2-x1)/diff*(z2-z1);
            y1 = y2 - (y2-y1)/diff*(z2-z1);
         }
         if (side2!==0) {
            var diff = z1-z2;
            z2 = (side2<0) ? 0 : 2*main.size_z3d;
            x2 = x1 - (x1-x2)/diff*(z1-z2);
            y2 = y1 - (y1-y2)/diff*(z1-z2);
         }

         lpos[lindx] = x1; lpos[lindx+1] = y1; lpos[lindx+2] = z1; lindx+=3;
         lpos[lindx] = x2; lpos[lindx+1] = y2; lpos[lindx+2] = z2; lindx+=3;
      }

      var pntbuf = new Float32Array(6*3), k = 0, lastpart = 0; // maximal 6 points
      var gridpnts = new Float32Array(2*3), gridcnt = 0;

      function AddCrossingPoint(xx1,yy1,zz1, xx2,yy2,zz2, crossz, with_grid) {
         if (k>=pntbuf.length) console.log('more than 6 points???');

         var part = (crossz - zz1) / (zz2 - zz1), shift = 3;
         if ((lastpart!==0) && (Math.abs(part) < Math.abs(lastpart))) {
            // while second crossing point closer than first to original, move it in memory
            pntbuf[k] = pntbuf[k-3];
            pntbuf[k+1] = pntbuf[k-2];
            pntbuf[k+2] = pntbuf[k-1];
            k-=3; shift = 6;
         }

         pntbuf[k] = xx1 + part*(xx2-xx1);
         pntbuf[k+1] = yy1 + part*(yy2-yy1);
         pntbuf[k+2] = crossz;

         if (with_grid && grid) {
            gridpnts[gridcnt] = pntbuf[k];
            gridpnts[gridcnt+1] = pntbuf[k+1];
            gridpnts[gridcnt+2] = pntbuf[k+2];
            gridcnt+=3;
         }

         k += shift;
         lastpart = part;
      }

      function RememberVertex(indx, ii,jj) {
         var bin = ((ii-handle.i1) * (handle.j2-handle.j1) + (jj-handle.j1))*8;

         if (normindx[bin]>=0)
            return console.error('More than 8 vertexes for the bin');

         var pos = bin+8+normindx[bin]; // position where write index
         normindx[bin]--;
         normindx[pos] = indx; // at this moment index can be overwritten, means all 8 position are there
      }

      function RecalculateNormals(arr) {
         for (var ii=handle.i1;ii<handle.i2;++ii) {
            for (var jj=handle.j1;jj<handle.j2;++jj) {
               var bin = ((ii-handle.i1) * (handle.j2-handle.j1) + (jj-handle.j1)) * 8;

               if (normindx[bin] === -1) continue; // nothing there

               var beg = (normindx[bin] >=0) ? bin : bin+9+normindx[bin],
                   end = bin+8, sumx=0, sumy = 0, sumz = 0;

               for (var kk=beg;kk<end;++kk) {
                  var indx = normindx[kk];
                  if (indx<0) return console.error('FAILURE in NORMALS RECALCULATIONS');
                  sumx+=arr[indx];
                  sumy+=arr[indx+1];
                  sumz+=arr[indx+2];
               }

               sumx = sumx/(end-beg); sumy = sumy/(end-beg); sumz = sumz/(end-beg);

               for (var kk=beg;kk<end;++kk) {
                  var indx = normindx[kk];
                  arr[indx] = sumx;
                  arr[indx+1] = sumy;
                  arr[indx+2] = sumz;
               }
            }
         }
      }

      function AddMainTriangle(x1,y1,z1, x2,y2,z2, x3,y3,z3, is_first) {

         for (var lvl=1;lvl<levels.length;++lvl) {

            var side1 = CheckSide(z1, levels[lvl-1], levels[lvl]),
                side2 = CheckSide(z2, levels[lvl-1], levels[lvl]),
                side3 = CheckSide(z3, levels[lvl-1], levels[lvl]),
                side_sum = side1 + side2 + side3;

            if (side_sum === 3) continue;
            if (side_sum === -3) return;

            if (!loop) {
               var npnts = Math.abs(side2-side1) + Math.abs(side3-side2) + Math.abs(side1-side3);
               if (side1===0) ++npnts;
               if (side2===0) ++npnts;
               if (side3===0) ++npnts;

               if ((npnts===1) || (npnts===2)) console.error('FOND npnts', npnts);

               if (npnts>2) {
                  if (nfaces[lvl]===undefined) nfaces[lvl] = 0;
                  nfaces[lvl] += npnts-2;
               }

               // check if any(contours for given level exists
               if (((side1>0) || (side2>0) || (side3>0)) &&
                   ((side1!==side2) || (side2!==side3) || (side3!==side1))) ++ngridsegments;

               continue;
            }

            gridcnt = 0;

            k = 0;
            if (side1 === 0) { pntbuf[k] = x1; pntbuf[k+1] = y1; pntbuf[k+2] = z1; k+=3; }

            if (side1!==side2) {
               // order is important, should move from 1->2 point, checked via lastpart
               lastpart = 0;
               if ((side1<0) || (side2<0)) AddCrossingPoint(x1,y1,z1, x2,y2,z2, levels[lvl-1]);
               if ((side1>0) || (side2>0)) AddCrossingPoint(x1,y1,z1, x2,y2,z2, levels[lvl], true);
            }

            if (side2 === 0) { pntbuf[k] = x2; pntbuf[k+1] = y2; pntbuf[k+2] = z2; k+=3; }

            if (side2!==side3) {
               // order is important, should move from 2->3 point, checked via lastpart
               lastpart = 0;
               if ((side2<0) || (side3<0)) AddCrossingPoint(x2,y2,z2, x3,y3,z3, levels[lvl-1]);
               if ((side2>0) || (side3>0)) AddCrossingPoint(x2,y2,z2, x3,y3,z3, levels[lvl], true);
            }

            if (side3 === 0) { pntbuf[k] = x3; pntbuf[k+1] = y3; pntbuf[k+2] = z3; k+=3; }

            if (side3!==side1) {
               // order is important, should move from 3->1 point, checked via lastpart
               lastpart = 0;
               if ((side3<0) || (side1<0)) AddCrossingPoint(x3,y3,z3, x1,y1,z1, levels[lvl-1]);
               if ((side3>0) || (side1>0)) AddCrossingPoint(x3,y3,z3, x1,y1,z1, levels[lvl], true);
            }

            if (k===0) continue;
            if (k<9) { console.log('found less than 3 points', k/3); continue; }

            if (grid && (gridcnt === 6)) {
               for (var jj=0;jj < 6; ++jj)
                  grid[gindx+jj] = gridpnts[jj];
               gindx+=6;
            }


            // if three points and surf==14, remember vertex for each point

            var buf = pos[lvl], s = indx[lvl];
            if (donormals && (k===9)) {
               RememberVertex(s, i, j);
               RememberVertex(s+3, i+1, is_first ? j+1 : j);
               RememberVertex(s+6, is_first ? i : i+1, j+1);
            }

            for (var k1=3;k1<k-3;k1+=3) {
               buf[s] = pntbuf[0]; buf[s+1] = pntbuf[1]; buf[s+2] = pntbuf[2]; s+=3;
               buf[s] = pntbuf[k1]; buf[s+1] = pntbuf[k1+1]; buf[s+2] = pntbuf[k1+2]; s+=3;
               buf[s] = pntbuf[k1+3]; buf[s+1] = pntbuf[k1+4]; buf[s+2] = pntbuf[k1+5]; s+=3;
            }
            indx[lvl] = s;

         }
      }

      if (donormals) {
         // for each bin maximal 8 points reserved
         normindx = new Int32Array((handle.i2-handle.i1)*(handle.j2-handle.j1)*8);
         for (var n=0;n<normindx.length;++n) normindx[n] = -1;
      }

      for (loop=0;loop<2;++loop) {
         if (loop) {
            for (var lvl=1;lvl<levels.length;++lvl)
               if (nfaces[lvl]) {
                  pos[lvl] = new Float32Array(nfaces[lvl] * 9);
                  indx[lvl] = 0;
               }
            if (dolines && (nsegments > 0))
               lpos = new Float32Array(nsegments * 6);
            if (dogrid && (ngridsegments>0))
               grid = new Float32Array(ngridsegments * 6);
         }
         for (i=handle.i1;i<handle.i2-1;++i) {
            x1 = handle.grx[i];
            x2 = handle.grx[i+1];
            for (j=handle.j1;j<handle.j2-1;++j) {
               y1 = handle.gry[j];
               y2 = handle.gry[j+1];
               z11 = main_grz(histo.getBinContent(i+1, j+1));
               z12 = main_grz(histo.getBinContent(i+1, j+2));
               z21 = main_grz(histo.getBinContent(i+2, j+1));
               z22 = main_grz(histo.getBinContent(i+2, j+2));

               AddMainTriangle(x1,y1,z11, x2,y2,z22, x1,y2,z12, true);

               AddMainTriangle(x1,y1,z11, x2,y1,z21, x2,y2,z22, false);

               AddLineSegment(x1,y2,z12, x1,y1,z11);
               AddLineSegment(x1,y1,z11, x2,y1,z21);

               if (i===handle.i2-2) AddLineSegment(x2,y1,z21, x2,y2,z22);
               if (j===handle.j2-2) AddLineSegment(x1,y2,z12, x2,y2,z22);
            }
         }
      }

      for (var lvl=1;lvl<levels.length;++lvl)
         if (pos[lvl]) {
            if (indx[lvl] !== nfaces[lvl]*9)
                 console.error('SURF faces missmatch lvl', lvl, 'faces', nfaces[lvl], 'index', indx[lvl], 'check', nfaces[lvl]*9 - indx[lvl]);
            var geometry = new THREE.BufferGeometry();
            geometry.addAttribute( 'position', new THREE.BufferAttribute( pos[lvl], 3 ) );
            geometry.computeVertexNormals();
            if (donormals && (lvl===1)) RecalculateNormals(geometry.getAttribute('normal').array);

            var fcolor, material;
            if (docolorfaces) {
               fcolor = this.getIndexColor(lvl);
            } else {
               fcolor = histo.fFillColor > 1 ? JSROOT.Painter.root_colors[histo.fFillColor] : 'white';
               if ((this.options.Surf === 14) && (histo.fFillColor<2)) fcolor = JSROOT.Painter.root_colors[48];
            }
            if (this.options.Surf === 14)
               material = new THREE.MeshLambertMaterial( { color: fcolor, side: THREE.DoubleSide  } );
            else
               material = new THREE.MeshBasicMaterial( { color: fcolor, side: THREE.DoubleSide  } );

            var mesh = new THREE.Mesh(geometry, material);

            main.toplevel.add(mesh);

            mesh.painter = this; // to let use it with context menu
         }


      if (lpos) {
         if (nsegments*6 !== lindx)
            console.error('SURF lines mismmatch nsegm', nsegments, ' lindx', lindx, 'difference', nsegments*6 - lindx);

         var geometry = new THREE.BufferGeometry();
         geometry.addAttribute( 'position', new THREE.BufferAttribute( lpos, 3 ) );
         var lcolor = JSROOT.Painter.root_colors[histo.fLineColor];

         var material = new THREE.LineBasicMaterial({ color: new THREE.Color(lcolor) });
         if (!JSROOT.browser.isIE) material.linewidth = histo.fLineWidth;
         var line = new THREE.LineSegments(geometry, material);
         line.painter = this;
         main.toplevel.add(line);
      }

      if (grid) {
         if (ngridsegments*6 !== gindx)
            console.error('SURF grid draw mismatch ngridsegm', ngridsegments, 'gindx', gindx, 'diff', ngridsegments*6 - gindx);

         var geometry = new THREE.BufferGeometry();
         geometry.addAttribute( 'position', new THREE.BufferAttribute( grid, 3 ) );

         var material;

         if (this.options.Surf === 1)
            material = new THREE.LineDashedMaterial( { color: 0x0, dashSize: 2, gapSize: 2  } );
         else
            material = new THREE.LineBasicMaterial({ color: new THREE.Color(JSROOT.Painter.root_colors[histo.fLineColor]) });

         var line = new THREE.LineSegments(geometry, material);
         line.painter = this;
         main.toplevel.add(line);
      }

      if (this.options.Surf === 17)
         JSROOT.Painter.HistPainter_DrawContour3D.call(this);

      if (this.options.Surf === 13) {

         handle = main.PrepareColorDraw({rounding: false, use3d: true, extra: 100, middle: 0.0 });

         this.getContourIndex(0);

         // get levels
         var levels = this.fContour,
             palette = this.GetPalette(),
             lastcolindx = -1, layerz = 2*main.size_z3d;

         this.BuildContour(handle, levels, palette,
            function(colindx,xp,yp,iminus,iplus) {
                // ignore less than three points
                if (iplus - iminus < 3) return;

                var pnts = [];

                for (var i = iminus; i<=iplus; ++i)
                   if ((i === iminus) || (xp[i] !== xp[i-1]) || (yp[i] !== yp[i-1]))
                      pnts.push(new THREE.Vector2(xp[i], yp[i]));

                if (pnts.length < 3) return;

                var faces = THREE.ShapeUtils.triangulateShape(pnts , []);

                if (!faces || (faces.length === 0)) return;

                if ((lastcolindx < 0) || (lastcolindx !== colindx)) {
                   lastcolindx = colindx;
                   layerz+=0.0001*main.size_z3d; // change layers Z
                }

                var pos = new Float32Array(faces.length*9),
                    norm = new Float32Array(faces.length*9),
                    indx = 0;

                for (var n=0;n<faces.length;++n) {
                   var face = faces[n];
                   for (var v=0;v<3;++v) {
                      var pnt = pnts[face[v]];
                      pos[indx] = pnt.x;
                      pos[indx+1] = pnt.y;
                      pos[indx+2] = layerz;
                      norm[indx] = 0;
                      norm[indx+1] = 0;
                      norm[indx+2] = 1;

                      indx+=3;
                   }
                }

                var geometry = new THREE.BufferGeometry();
                geometry.addAttribute( 'position', new THREE.BufferAttribute( pos, 3 ) );
                geometry.addAttribute( 'normal', new THREE.BufferAttribute( norm, 3 ) );

                var fcolor = palette[colindx];
                var material = new THREE.MeshBasicMaterial( { color: fcolor, shading: THREE.SmoothShading, side: THREE.DoubleSide, opacity: 0.5  } );
                var mesh = new THREE.Mesh(geometry, material);
                mesh.painter = this;
                main.toplevel.add(mesh);
            }
         );
      }
   }

   JSROOT.Painter.HistPainter_DrawPolyLego = function() {

      var histo = this.GetObject(),
          pmain = this.main_painter(),
          axis_zmin = this.grz.domain()[0],
          axis_zmax = this.grz.domain()[1],
          colindx, bin, i, len = histo.fBins.arr.length, cnt = 0, totalnfaces = 0,
          z0 = this.grz(axis_zmin), z1 = z0;

      // force recalculations of contours
      this.fContour = null;
      this.fCustomContour = false;

      // use global coordinates
      this.maxbin = this.gmaxbin;
      this.minbin = this.gminbin;
      this.minposbin = this.gminposbin;

      for (i = 0; i < len; ++ i) {
         bin = histo.fBins.arr[i];
         if (bin.fContent < axis_zmin) continue;

         colindx = this.getValueColor(bin.fContent, true);
         if (colindx === null) continue;

         // check if bin outside visible range
         if ((bin.fXmin > pmain.scale_xmax) || (bin.fXmax < pmain.scale_xmin) ||
             (bin.fYmin > pmain.scale_ymax) || (bin.fYmax < pmain.scale_ymin)) continue;

         z1 = this.grz(bin.fContent > axis_zmax ? axis_zmax : bin.fContent);

         var all_pnts = [], all_faces = [],
             ngraphs = 1, gr = bin.fPoly, nfaces = 0;

         if (gr._typename=='TMultiGraph') {
            ngraphs = bin.fPoly.fGraphs.arr.length;
            gr = null;
         }

         for (var ngr = 0; ngr < ngraphs; ++ngr) {
            if (!gr || (ngr>0)) gr = bin.fPoly.fGraphs.arr[ngr];

            var npnts = gr.fNpoints, x = gr.fX, y = gr.fY;
            while ((npnts>2) && (x[0]===x[npnts-1]) && (y[0]===y[npnts-1])) --npnts;

            var pnts, faces;

            for (var ntry=0;ntry<2;++ntry) {
               // run two loops - on the first try to compress data, on second - run as is (removing duplication)

               var lastx, lasty, currx, curry,
                   dist2 = pmain.size_xy3d*pmain.size_z3d,
                   dist2limit = (ntry>0) ? 0 : dist2/1e6;

               pnts = []; faces = null;

               for (var vert = 0; vert < npnts; ++vert) {
                  currx = pmain.grx(x[vert]);
                  curry = pmain.gry(y[vert]);
                  if (vert>0)
                     dist2 = (currx-lastx)*(currx-lastx) + (curry-lasty)*(curry-lasty);
                  if (dist2 > dist2limit) {
                     pnts.push(new THREE.Vector2(currx, curry));
                     lastx = currx;
                     lasty = curry;
                  }
               }

               try {
                  if (pnts.length > 2)
                     faces = THREE.ShapeUtils.triangulateShape(pnts , []);
               } catch(e) {
                  faces = null;
               }

               if (faces && (faces.length>pnts.length-3)) break;
            }

            if (faces && faces.length && pnts) {
               all_pnts.push(pnts);
               all_faces.push(faces);

               nfaces += faces.length * 2;
               if (z1>z0) nfaces += pnts.length*2;
            }
         }

         var pos = new Float32Array(nfaces*9), indx = 0;

         for (var ngr=0;ngr<all_pnts.length;++ngr) {
            var pnts = all_pnts[ngr], faces = all_faces[ngr];

            for (var layer=0;layer<2;++layer) {
               for (var n=0;n<faces.length;++n) {
                  var face = faces[n],
                      pnt1 = pnts[face[0]],
                      pnt2 = pnts[face[(layer===0) ? 2 : 1]],
                      pnt3 = pnts[face[(layer===0) ? 1 : 2]];

                  pos[indx] = pnt1.x;
                  pos[indx+1] = pnt1.y;
                  pos[indx+2] = layer ? z1 : z0;
                  indx+=3;

                  pos[indx] = pnt2.x;
                  pos[indx+1] = pnt2.y;
                  pos[indx+2] = layer ? z1 : z0;
                  indx+=3;

                  pos[indx] = pnt3.x;
                  pos[indx+1] = pnt3.y;
                  pos[indx+2] = layer ? z1 : z0;
                  indx+=3;
               }
            }

            if (z1>z0) {
               for (var n=0;n<pnts.length;++n) {
                  var pnt1 = pnts[n],
                      pnt2 = pnts[(n>0) ? n-1 : pnts.length-1];

                  pos[indx] = pnt1.x;
                  pos[indx+1] = pnt1.y;
                  pos[indx+2] = z0;
                  indx+=3;

                  pos[indx] = pnt2.x;
                  pos[indx+1] = pnt2.y;
                  pos[indx+2] = z0;
                  indx+=3;

                  pos[indx] = pnt2.x;
                  pos[indx+1] = pnt2.y;
                  pos[indx+2] = z1;
                  indx+=3;

                  pos[indx] = pnt1.x;
                  pos[indx+1] = pnt1.y;
                  pos[indx+2] = z0;
                  indx+=3;

                  pos[indx] = pnt2.x;
                  pos[indx+1] = pnt2.y;
                  pos[indx+2] = z1;
                  indx+=3;

                  pos[indx] = pnt1.x;
                  pos[indx+1] = pnt1.y;
                  pos[indx+2] = z1;
                  indx+=3;
               }
            }
         }

         var geometry = new THREE.BufferGeometry();
         geometry.addAttribute( 'position', new THREE.BufferAttribute( pos, 3 ) );
         geometry.computeVertexNormals();

         var fcolor = this.fPalette[colindx];
         var material = new THREE.MeshBasicMaterial( { color: fcolor, shading: THREE.SmoothShading  } );
         var mesh = new THREE.Mesh(geometry, material);

         pmain.toplevel.add(mesh);

         mesh.painter = this;
         mesh.bins_index = i;
         mesh.draw_z0 = z0;
         mesh.draw_z1 = z1;
         mesh.tip_color = 0x00FF00;

         mesh.tooltip = function(intersects) {

            var p = this.painter, main = p.main_painter(),
                bin = p.GetObject().fBins.arr[this.bins_index];

            var tip = {
              use_itself: true, // indicate that use mesh itself for highlighting
              x1: main.grx(bin.fXmin),
              x2: main.grx(bin.fXmax),
              y1: main.gry(bin.fYmin),
              y2: main.gry(bin.fYmax),
              z1: this.draw_z0,
              z2: this.draw_z1,
              bin: this.bins_index,
              value: bin.fContent,
              color: this.tip_color,
              info: p.ProvidePolyBinHints(this.bins_index)
            };

            return tip;
         };

         totalnfaces += nfaces;
         cnt++;
      }
   }

   JSROOT.Painter.IsRender3DFired = function(painter) {
      if (!painter || painter.renderer === undefined) return false;

      return painter.render_tmout !== undefined; // when timeout configured, object is prepared for rendering
   }

   JSROOT.Painter.Render3D = function(tmout) {
      if (tmout === -1111) {
         // special handling for SVG renderer

         var rrr = new THREE.SVGRendererNew({ antialias: true, alpha: true });
         rrr.setSize(this.scene_width, this.scene_height);
         rrr.render(this.scene, this.camera);
         return rrr.domElement;
      }

      if (tmout === undefined) tmout = 5; // by default, rendering happens with timeout

      if ((tmout <= 0) || this.usesvg) {
         if ('render_tmout' in this)
            clearTimeout(this.render_tmout);

         if (this.renderer === undefined) return;

         var tm1 = new Date();

         if (typeof this.TestAxisVisibility === 'function')
            this.TestAxisVisibility(this.camera, this.toplevel, this.options.FrontBox, this.options.BackBox);

         // do rendering, most consuming time
         this.renderer.render(this.scene, this.camera);

         var tm2 = new Date();

         delete this.render_tmout;

         if (this.first_render_tm === 0) {
            this.first_render_tm = tm2.getTime() - tm1.getTime();
            this.enable_hightlight = (this.first_render_tm < 1200) && this.tooltip_allowed;
            console.log('First render tm = ' + this.first_render_tm);
         }

         return;
      }

      // no need to shoot rendering once again
      if ('render_tmout' in this) return;

      this.render_tmout = setTimeout(this.Render3D.bind(this,0), tmout);
   }

   JSROOT.Painter.Resize3D = function() {

      var sz = this.size_for_3d(this.access_3d_kind());

      this.apply_3d_size(sz);

      if ((this.scene_width === sz.width) && (this.scene_height === sz.height)) return false;

      if ((sz.width<10) || (sz.height<10)) return false;

      // TODO: change xy/z ratio after canvas resize
      // this.size_xy3d = Math.round(sz.width/sz.height*this.size_z3d);

      this.scene_width = sz.width;
      this.scene_height = sz.height;

      this.camera.aspect = this.scene_width / this.scene_height;
      this.camera.updateProjectionMatrix();

      this.renderer.setSize( this.scene_width, this.scene_height );

      return true;
   }

   JSROOT.Painter.TH1Painter_Draw3D = function(call_back, resize) {
      // function called with this as painter

      var main = this.main_painter();

      if (resize)  {

         if ((main === this) && (this.Resize3D !== undefined) && this.Resize3D()) this.Render3D();

      } else {

         this.Draw3DBins = JSROOT.Painter.HistPainter_DrawLego;

         this.DeleteAtt();

         if (main === this) {
            this.Create3DScene();
            this.DrawXYZ(this.toplevel, { use_y_for_z: true, zmult: 1.1, zoom: JSROOT.gStyle.Zooming });
         }

         this.ScanContent(true);

         this.Draw3DBins();

         main.Render3D();

         main.UpdateStatWebCanvas();

         this.AddKeysHandler();
      }

      if (main === this) {
         // (re)draw palette by resize while canvas may change dimension
         this.DrawColorPalette((this.options.Zscale > 0) && ((this.options.Lego===12) || (this.options.Lego===14)));

         this.DrawTitle();
      }

      JSROOT.CallBack(call_back);
   }


   JSROOT.Painter.TH2Painter_Draw3D = function(call_back, resize) {
      // function called with this as painter

      this.mode3d = true;

      var main = this.main_painter();

      if (resize) {

         if ((main === this) && (this.Resize3D !== undefined) && this.Resize3D()) this.Render3D();

      } else {

         this.Draw3DBins = JSROOT.Painter.HistPainter_DrawLego;

         var pad = this.root_pad();
         // if (pad && pad.fGridz === undefined) pad.fGridz = false;

         this.zmin = pad.fLogz ? this.gminposbin * 0.3 : this.gminbin;
         this.zmax = this.gmaxbin;

         var zmult = 1.1;

         if (this.options.minimum !== -1111) this.zmin = this.options.minimum;
         if (this.options.maximum !== -1111) { this.zmax = this.options.maximum; zmult = 1; }

         if (pad.fLogz && (this.zmin<=0)) this.zmin = this.zmax * 1e-5;

         this.DeleteAtt();

         if (main === this) {
            this.Create3DScene();
            this.DrawXYZ(this.toplevel, { zmult: zmult, zoom: JSROOT.gStyle.Zooming });
         }

         this.Draw3DBins();

         main.Render3D();

         this.UpdateStatWebCanvas();

         this.AddKeysHandler();
      }

      if (main === this) {

         //  (re)draw palette by resize while canvas may change dimension
         this.DrawColorPalette((this.options.Zscale > 0) && ((this.options.Lego===12) || (this.options.Lego===14) ||
                                (this.options.Surf===11) || (this.options.Surf===12)));

         this.DrawTitle();
      }

      JSROOT.CallBack(call_back);
   }

   // ==============================================================================

   JSROOT.Painter.PointsCreator = function(size, iswebgl, scale) {
      if (iswebgl === undefined) iswebgl = true;
      this.webgl = iswebgl;
      this.scale = scale || 1.;

      if (this.webgl) {
         this.pos = new Float32Array(size*3);
      } else {
         this.pos = new Float32Array(JSROOT.Painter.Box_Indexes.length*3*size);
         this.norm = new Float32Array(JSROOT.Painter.Box_Indexes.length*3*size);
      }
      this.indx = 0;
   }

   JSROOT.Painter.PointsCreator.prototype.AddPoint = function(x,y,z) {
      if (this.webgl) {
         this.pos[this.indx]   = x;
         this.pos[this.indx+1] = y;
         this.pos[this.indx+2] = z;
         this.indx+=3;
         return;
      }

      var indicies = JSROOT.Painter.Box_Indexes,
          normals = JSROOT.Painter.Box_Normals,
          vertices = JSROOT.Painter.Box_Vertices;

      for (var k=0,nn=-3;k<indicies.length;++k) {
         var vert = vertices[indicies[k]];
         this.pos[this.indx]   = x + (vert.x - 0.5)*this.scale;
         this.pos[this.indx+1] = y + (vert.y - 0.5)*this.scale;
         this.pos[this.indx+2] = z + (vert.z - 0.5)*this.scale;

         if (k%6===0) nn+=3;
         this.norm[this.indx] = normals[nn];
         this.norm[this.indx+1] = normals[nn+1];
         this.norm[this.indx+2] = normals[nn+2];

         this.indx+=3;
      }
   }

   JSROOT.Painter.PointsCreator.prototype.CreateMesh = function(mcolor) {
      var geom = new THREE.BufferGeometry();
      geom.addAttribute( 'position', new THREE.BufferAttribute( this.pos, 3 ) );
      if (this.norm) geom.addAttribute( 'normal', new THREE.BufferAttribute( this.norm, 3 ) );

      var mesh = null;

      if (this.webgl) {
         var material = new THREE.PointsMaterial( { size: 3*this.scale, color: mcolor } );
         mesh = new THREE.Points(geom, material);
         mesh.nvertex = 1;
      } else {
         // var material = new THREE.MeshPhongMaterial({ color : fcolor, specular : 0x4f4f4f});
         var material = new THREE.MeshBasicMaterial( { color: mcolor, shading: THREE.SmoothShading  } );
         mesh = new THREE.Mesh(geom, material);
         mesh.nvertex = JSROOT.Painter.Box_Indexes.length;
      }

      return mesh;
   }

   JSROOT.Painter.drawGraph2D = function(divid, gr, opt) {
      // this set to TObjectPainter instance, redefine several functions

      this.DecodeOptions = function(opt) {
         var d = new JSROOT.DrawOptions(opt);

         var res = { Color: d.check("COL"),
                     Error: d.check("ERR") && this.MatchObjectType("TGraph2DErrors"),
                     Markers: d.check("P") };

         if (!res.Markers && !res.Error) res.Markers = true;
         if (!res.Markers) res.Color = false;

         return res;
      }

      this.CreateHistogram = function() {
         var gr = this.GetObject();

         var xmin = gr.fX[0], xmax = xmin,
             ymin = gr.fY[0], ymax = ymin,
             zmin = gr.fZ[0], zmax = zmin;

         for (var p = 0; p < gr.fNpoints;++p) {

            var x = gr.fX[p], y = gr.fY[p], z = gr.fZ[p],
                errx = this.options.Error ? gr.fEX[p] : 0,
                erry = this.options.Error ? gr.fEY[p] : 0,
                errz = this.options.Error ? gr.fEZ[p] : 0;

            xmin = Math.min(xmin, x-errx);
            xmax = Math.max(xmax, x+errx);
            ymin = Math.min(ymin, y-erry);
            ymax = Math.max(ymax, y+erry);
            zmin = Math.min(zmin, z-errz);
            zmax = Math.max(zmax, z+errz);
         }

         if (xmin >= xmax) xmax = xmin+1;
         if (ymin >= ymax) ymax = ymin+1;
         if (zmin >= zmax) zmax = zmin+1;
         var dx = (xmax-xmin)*0.02, dy = (ymax-ymin)*0.02, dz = (zmax-zmin)*0.02,
             uxmin = xmin - dx, uxmax = xmax + dx,
             uymin = ymin - dy, uymax = ymax + dy,
             uzmin = zmin - dz, uzmax = zmax + dz;

         if ((uxmin<0) && (xmin>=0)) uxmin = xmin*0.98;
         if ((uxmax>0) && (xmax<=0)) uxmax = 0;

         if ((uymin<0) && (ymin>=0)) uymin = ymin*0.98;
         if ((uymax>0) && (ymax<=0)) uymax = 0;

         if ((uzmin<0) && (zmin>=0)) uzmin = zmin*0.98;
         if ((uzmax>0) && (zmax<=0)) uzmax = 0;

         var graph = this.GetObject();

         if (graph.fMinimum != -1111) uzmin = graph.fMinimum;
         if (graph.fMaximum != -1111) uzmax = graph.fMaximum;

         var histo = JSROOT.CreateHistogram("TH2I", 10, 10);
         histo.fName = graph.fName + "_h";
         histo.fTitle = graph.fTitle;
         histo.fXaxis.fXmin = uxmin;
         histo.fXaxis.fXmax = uxmax;
         histo.fYaxis.fXmin = uymin;
         histo.fYaxis.fXmax = uymax;
         histo.fZaxis.fXmin = uzmin;
         histo.fZaxis.fXmax = uzmax;
         histo.fMinimum = uzmin;
         histo.fMaximum = uzmax;
         histo.fBits = histo.fBits | JSROOT.TH1StatusBits.kNoStats;
         return histo;
      }

     this.Graph2DTooltip = function(intersect) {
         var indx = Math.floor(intersect.index / this.nvertex);
         if ((indx<0) || (indx >= this.index.length)) return null;

         indx = this.index[indx];

         var p = this.painter,
             grx = p.grx(this.graph.fX[indx]),
             gry = p.gry(this.graph.fY[indx]),
             grz = p.grz(this.graph.fZ[indx]),
             tip = { info: this.tip_name + "<br/>" +
                   "pnt: " + indx + "<br/>" +
                   "x: " + p.x_handle.format(this.graph.fX[indx]) + "<br/>" +
                   "y: " + p.y_handle.format(this.graph.fY[indx]) + "<br/>" +
                   "z: " + p.z_handle.format(this.graph.fZ[indx]) };

         tip.x1 = grx - this.scale0; tip.x2 = grx + this.scale0;
         tip.y1 = gry - this.scale0; tip.y2 = gry + this.scale0;
         tip.z1 = grz - this.scale0; tip.z2 = grz + this.scale0;

         tip.color = this.tip_color;

         return tip;
      }

      this.Redraw = function() {

         var main = this.main_painter(),
             graph = this.GetObject(),
             step = 1;

         if (!graph || !main  || !('renderer' in main)) return;

         function CountSelected(zmin, zmax) {
            var cnt = 0;
            for (var i=0; i < graph.fNpoints; ++i) {
               if ((graph.fX[i] < main.scale_xmin) || (graph.fX[i] > main.scale_xmax) ||
                     (graph.fY[i] < main.scale_ymin) || (graph.fY[i] > main.scale_ymax) ||
                     (graph.fZ[i] < zmin) || (graph.fZ[i] >= zmax)) continue;

               ++cnt;
            }
            return cnt;
         }

         // try to define scale-down factor
         if ((JSROOT.gStyle.OptimizeDraw > 0) && !main.webgl) {
            var numselected = CountSelected(main.scale_zmin, main.scale_zmax),
            sizelimit = main.webgl ? 50000 : 5000;

            if (numselected > sizelimit) {
               step = Math.floor(numselected / sizelimit);
               if (step <= 2) step = 2;
            }
         }

         var markeratt = JSROOT.Painter.createAttMarker(graph),
            palette = null,
            levels = [main.scale_zmin, main.scale_zmax],
            scale = main.size_xy3d / 100 * markeratt.size * markeratt.scale;


         if (this.options.Color) {
            levels = main.GetContour();
            palette = main.GetPalette();
         }

         for (var lvl=0;lvl<levels.length-1;++lvl) {

            var lvl_zmin = Math.max(levels[lvl], main.scale_zmin),
                lvl_zmax = Math.min(levels[lvl+1], main.scale_zmax);

            if (lvl_zmin >= lvl_zmax) continue;

            var size = Math.floor(CountSelected(lvl_zmin, lvl_zmax) / step),
                pnts = null, select = 0,
                index = new Int32Array(size), icnt = 0,
                err = null, ierr = 0;

            if (this.options.Markers)
               pnts = new JSROOT.Painter.PointsCreator(size, main.webgl, scale/3);

            if (this.options.Error)
               err = new Float32Array(size*6*3);

            for (var i=0; i < graph.fNpoints; ++i) {
               if ((graph.fX[i] < main.scale_xmin) || (graph.fX[i] > main.scale_xmax) ||
                   (graph.fY[i] < main.scale_ymin) || (graph.fY[i] > main.scale_ymax) ||
                   (graph.fZ[i] < lvl_zmin) || (graph.fZ[i] >= lvl_zmax)) continue;

               if (step > 1) {
                  select = (select+1) % step;
                  if (select!==0) continue;
               }

               index[icnt++] = i; // remember point index for tooltip

               var x = main.grx(graph.fX[i]),
                   y = main.gry(graph.fY[i]),
                   z = main.grz(graph.fZ[i]);

               if (pnts) pnts.AddPoint(x,y,z);

               if (err) {
                  err[ierr]   = main.grx(graph.fX[i] - graph.fEX[i]);
                  err[ierr+1] = y;
                  err[ierr+2] = z;
                  err[ierr+3] = main.grx(graph.fX[i] + graph.fEX[i]);
                  err[ierr+4] = y;
                  err[ierr+5] = z;
                  ierr+=6;
                  err[ierr]   = x;
                  err[ierr+1] = main.gry(graph.fY[i] - graph.fEY[i]);
                  err[ierr+2] = z;
                  err[ierr+3] = x;
                  err[ierr+4] = main.gry(graph.fY[i] + graph.fEY[i]);
                  err[ierr+5] = z;
                  ierr+=6;
                  err[ierr]   = x;
                  err[ierr+1] = y;
                  err[ierr+2] = main.grz(graph.fZ[i] - graph.fEZ[i]);
                  err[ierr+3] = x;
                  err[ierr+4] = y;
                  err[ierr+5] = main.grz(graph.fZ[i] + graph.fEZ[i]);;
                  ierr+=6;
               }

            }

            if (err) {
               var geometry = new THREE.BufferGeometry();
               geometry.addAttribute( 'position', new THREE.BufferAttribute( err, 3 ) );

               var lcolor = JSROOT.Painter.root_colors[this.GetObject().fLineColor];

               var material = new THREE.LineBasicMaterial({ color: new THREE.Color(lcolor) });
               if (!JSROOT.browser.isIE) material.linewidth = this.GetObject().fLineWidth;
               var errmesh = new THREE.LineSegments(geometry, material);
               main.toplevel.add(errmesh);

               errmesh.graph = graph;
               errmesh.index = index;
               errmesh.painter = main;
               errmesh.scale0 = 0.7*scale;
               errmesh.tip_name = this.GetTipName();
               errmesh.tip_color = (graph.fMarkerColor === 3) ? 0xFF0000 : 0x00FF00;
               errmesh.nvertex = 6;

               errmesh.tooltip = this.Graph2DTooltip;
            }

            if (pnts) {

               var fcolor = JSROOT.Painter.root_colors[graph.fMarkerColor];

               if (palette) {
                  var indx = Math.floor((lvl+0.99)*palette.length/(levels.length-1));
                  if (indx >= palette.length) indx = palette.length-1;
                  fcolor = palette[indx];
               }

               var mesh = pnts.CreateMesh(fcolor);

               main.toplevel.add(mesh);

               mesh.graph = graph;
               mesh.index = index;
               mesh.painter = main;
               mesh.scale0 = 0.3*scale;
               mesh.tip_name = this.GetTipName();
               mesh.tip_color = (graph.fMarkerColor === 3) ? 0xFF0000 : 0x00FF00;

               mesh.tooltip = this.Graph2DTooltip;
            }
         }

         main.Render3D(100); // set large timeout to be able draw other points
      }

      this.SetDivId(divid, -1); // just to get access to existing elements

      this.options = this.DecodeOptions(opt);

      if (this.main_painter() == null) {
         if (gr.fHistogram == null)
            gr.fHistogram = this.CreateHistogram();
         JSROOT.Painter.drawHistogram2D(divid, gr.fHistogram, "lego");
         this.ownhisto = true;
      }

      this.SetDivId(divid);

      this.Redraw();

      return this.DrawingReady();
   }

   // ==============================================================================


   JSROOT.TH3Painter = function(histo) {
      JSROOT.THistPainter.call(this, histo);

      this.Create3DScene = JSROOT.Painter.HPainter_Create3DScene;

      this.mode3d = true;
   }

   JSROOT.TH3Painter.prototype = Object.create(JSROOT.THistPainter.prototype);

   JSROOT.TH3Painter.prototype.ScanContent = function(when_axis_changed) {

      // no need to rescan histogram while result does not depend from axis selection
      if (when_axis_changed && this.nbinsx && this.nbinsy && this.nbinsz) return;

      var histo = this.GetObject();

      this.nbinsx = histo.fXaxis.fNbins;
      this.nbinsy = histo.fYaxis.fNbins;
      this.nbinsz = histo.fZaxis.fNbins;

      this.xmin = histo.fXaxis.fXmin;
      this.xmax = histo.fXaxis.fXmax;

      this.ymin = histo.fYaxis.fXmin;
      this.ymax = histo.fYaxis.fXmax;

      this.zmin = histo.fZaxis.fXmin;
      this.zmax = histo.fZaxis.fXmax;

      // global min/max, used at the moment in 3D drawing

      this.gminbin = this.gmaxbin = histo.getBinContent(1,1,1);

      for (var i = 0; i < this.nbinsx; ++i)
         for (var j = 0; j < this.nbinsy; ++j)
            for (var k = 0; k < this.nbinsz; ++k) {
               var bin_content = histo.getBinContent(i+1, j+1, k+1);
               if (bin_content < this.gminbin) this.gminbin = bin_content; else
               if (bin_content > this.gmaxbin) this.gmaxbin = bin_content;
            }

      this.draw_content = this.gmaxbin > 0;

      this.CreateAxisFuncs(true, true);
   }

   JSROOT.TH3Painter.prototype.CountStat = function() {
      var histo = this.GetObject(),
          stat_sum0 = 0, stat_sumx1 = 0, stat_sumy1 = 0,
          stat_sumz1 = 0, stat_sumx2 = 0, stat_sumy2 = 0, stat_sumz2 = 0,
          i1 = this.GetSelectIndex("x", "left"),
          i2 = this.GetSelectIndex("x", "right"),
          j1 = this.GetSelectIndex("y", "left"),
          j2 = this.GetSelectIndex("y", "right"),
          k1 = this.GetSelectIndex("z", "left"),
          k2 = this.GetSelectIndex("z", "right"),
          res = { entries: 0, integral: 0, meanx: 0, meany: 0, meanz: 0, rmsx: 0, rmsy: 0, rmsz: 0 },
          xi, yi, zi, xx, xside, yy, yside, zz, zside, cont;

      for (xi = 0; xi < this.nbinsx+2; ++xi) {

         xx = this.GetBinX(xi - 0.5);
         xside = (xi < i1) ? 0 : (xi > i2 ? 2 : 1);

         for (yi = 0; yi < this.nbinsy+2; ++yi) {

            yy = this.GetBinY(yi - 0.5);
            yside = (yi < j1) ? 0 : (yi > j2 ? 2 : 1);

            for (zi = 0; zi < this.nbinsz+2; ++zi) {

               zz = this.GetBinZ(zi - 0.5);
               zside = (zi < k1) ? 0 : (zi > k2 ? 2 : 1);

               cont = histo.getBinContent(xi, yi, zi);
               res.entries += cont;

               if ((xside==1) && (yside==1) && (zside==1)) {
                  stat_sum0 += cont;
                  stat_sumx1 += xx * cont;
                  stat_sumy1 += yy * cont;
                  stat_sumz1 += zz * cont;
                  stat_sumx2 += xx * xx * cont;
                  stat_sumy2 += yy * yy * cont;
                  stat_sumz2 += zz * zz * cont;
               }
            }
         }
      }

      if ((histo.fTsumw > 0) && !this.IsAxisZoomed("x") && !this.IsAxisZoomed("y") && !this.IsAxisZoomed("z")) {
         stat_sum0  = histo.fTsumw;
         stat_sumx1 = histo.fTsumwx;
         stat_sumx2 = histo.fTsumwx2;
         stat_sumy1 = histo.fTsumwy;
         stat_sumy2 = histo.fTsumwy2;
         stat_sumz1 = histo.fTsumwz;
         stat_sumz2 = histo.fTsumwz2;
      }

      if (stat_sum0 > 0) {
         res.meanx = stat_sumx1 / stat_sum0;
         res.meany = stat_sumy1 / stat_sum0;
         res.meanz = stat_sumz1 / stat_sum0;
         res.rmsx = Math.sqrt(Math.abs(stat_sumx2 / stat_sum0 - res.meanx * res.meanx));
         res.rmsy = Math.sqrt(Math.abs(stat_sumy2 / stat_sum0 - res.meany * res.meany));
         res.rmsz = Math.sqrt(Math.abs(stat_sumz2 / stat_sum0 - res.meanz * res.meanz));
      }

      res.integral = stat_sum0;

      if (histo.fEntries > 1) res.entries = histo.fEntries;

      return res;
   }

   JSROOT.TH3Painter.prototype.FillStatistic = function(stat, dostat, dofit) {
      if (this.GetObject()===null) return false;

      var pave = stat.GetObject(),
          data = this.CountStat(),
          print_name = dostat % 10,
          print_entries = Math.floor(dostat / 10) % 10,
          print_mean = Math.floor(dostat / 100) % 10,
          print_rms = Math.floor(dostat / 1000) % 10,
          print_under = Math.floor(dostat / 10000) % 10,
          print_over = Math.floor(dostat / 100000) % 10,
          print_integral = Math.floor(dostat / 1000000) % 10;
      //var print_skew = Math.floor(dostat / 10000000) % 10;
      //var print_kurt = Math.floor(dostat / 100000000) % 10;

      if (print_name > 0)
         pave.AddText(this.GetObject().fName);

      if (print_entries > 0)
         pave.AddText("Entries = " + stat.Format(data.entries,"entries"));

      if (print_mean > 0) {
         pave.AddText("Mean x = " + stat.Format(data.meanx));
         pave.AddText("Mean y = " + stat.Format(data.meany));
         pave.AddText("Mean z = " + stat.Format(data.meanz));
      }

      if (print_rms > 0) {
         pave.AddText("Std Dev x = " + stat.Format(data.rmsx));
         pave.AddText("Std Dev y = " + stat.Format(data.rmsy));
         pave.AddText("Std Dev z = " + stat.Format(data.rmsz));
      }

      if (print_integral > 0) {
         pave.AddText("Integral = " + stat.Format(data.integral,"entries"));
      }

      // adjust the size of the stats box with the number of lines

      var nlines = pave.fLines.arr.length,
          stath = nlines * JSROOT.gStyle.StatFontSize;
      if (stath <= 0 || 3 == (JSROOT.gStyle.StatFont % 10)) {
         stath = 0.25 * nlines * JSROOT.gStyle.StatH;
         pave.fY1NDC = 0.93 - stath;
         pave.fY2NDC = 0.93;
      }

      return true;
   }

   JSROOT.TH3Painter.prototype.GetBinTips = function (ix, iy, iz) {
      var lines = [], pmain = this.main_painter();

      lines.push(this.GetTipName());

      if (pmain.x_kind == 'labels')
         lines.push("x = " + pmain.AxisAsText("x", this.GetBinX(ix)) + "  xbin=" + (ix+1));
      else
         lines.push("x = [" + pmain.AxisAsText("x", this.GetBinX(ix)) + ", " + pmain.AxisAsText("x", this.GetBinX(ix+1)) + ")   xbin=" + (ix+1));

      if (pmain.y_kind == 'labels')
         lines.push("y = " + pmain.AxisAsText("y", this.GetBinY(iy))  + "  ybin=" + (iy+1));
      else
         lines.push("y = [" + pmain.AxisAsText("y", this.GetBinY(iy)) + ", " + pmain.AxisAsText("y", this.GetBinY(iy+1)) + ")  ybin=" + (iy+1));

      if (pmain.z_kind == 'labels')
         lines.push("z = " + pmain.AxisAsText("z", this.GetBinZ(iz))  + "  zbin=" + (iz+1));
      else
         lines.push("z = [" + pmain.AxisAsText("z", this.GetBinZ(iz)) + ", " + pmain.AxisAsText("z", this.GetBinZ(iz+1)) + ")  zbin=" + (iz+1));

      var binz = this.GetObject().getBinContent(ix+1, iy+1, iz+1);
      if (binz === Math.round(binz))
         lines.push("entries = " + binz);
      else
         lines.push("entries = " + JSROOT.FFormat(binz, JSROOT.gStyle.fStatFormat));

      return lines;
   }

   JSROOT.TH3Painter.prototype.Draw3DScatter = function() {
      // try to draw 3D histogram as scatter plot
      // if too many points, box will be displayed

      var histo = this.GetObject(),
          main = this.main_painter(),
          i1 = this.GetSelectIndex("x", "left", 0.5),
          i2 = this.GetSelectIndex("x", "right", 0),
          j1 = this.GetSelectIndex("y", "left", 0.5),
          j2 = this.GetSelectIndex("y", "right", 0),
          k1 = this.GetSelectIndex("z", "left", 0.5),
          k2 = this.GetSelectIndex("z", "right", 0),
          name = this.GetTipName("<br/>"),
          i, j, k, bin_content;

      if ((i2<=i1) || (j2<=j1) || (k2<=k1)) return true;

      // scale down factor if too large values
      var coef = (this.gmaxbin > 1000) ? 1000/this.gmaxbin : 1,
          numpixels = 0, content_lmt = Math.max(0, this.gminbin);

      for (i = i1; i < i2; ++i) {
         for (j = j1; j < j2; ++j) {
            for (k = k1; k < k2; ++k) {
               bin_content = histo.getBinContent(i+1, j+1, k+1);
               if (bin_content <= content_lmt) continue;
               numpixels += Math.round(bin_content*coef);
            }
         }
      }

      // too many pixels - use box drawing
      if (numpixels > (main.webgl ? 100000 : 10000)) return false;

      var pnts = new JSROOT.Painter.PointsCreator(numpixels, main.webgl, main.size_xy3d/200),
          bins = new Int32Array(numpixels), nbin = 0;

      for (i = i1; i < i2; ++i) {
         for (j = j1; j < j2; ++j) {
            for (k = k1; k < k2; ++k) {
               bin_content = histo.getBinContent(i+1, j+1, k+1);
               if (bin_content <= content_lmt) continue;
               var num = Math.round(bin_content*coef);

               for (var n=0;n<num;++n) {
                  var binx = this.GetBinX(i+Math.random()),
                      biny = this.GetBinY(j+Math.random()),
                      binz = this.GetBinZ(k+Math.random());

                  // remeber bin index for tooltip
                  bins[nbin++] = histo.getBin(i+1, j+1, k+1);

                  pnts.AddPoint(main.grx(binx), main.gry(biny), main.grz(binz));

               }
            }
         }
      }

      var mesh = pnts.CreateMesh(JSROOT.Painter.root_colors[histo.fMarkerColor]);
      main.toplevel.add(mesh);

      mesh.bins = bins;
      mesh.painter = this;
      mesh.tip_color = (histo.fMarkerColor===3) ? 0xFF0000 : 0x00FF00;

      mesh.tooltip = function(intersect) {
         var indx = Math.floor(intersect.index / this.nvertex);
         if ((indx<0) || (indx >= this.bins.length)) return null;

         var p = this.painter,
             tip = p.Get3DToolTip(this.bins[indx]);

         tip.x1 = p.grx(p.GetBinX(tip.ix-1));
         tip.x2 = p.grx(p.GetBinX(tip.ix));
         tip.y1 = p.gry(p.GetBinY(tip.iy-1));
         tip.y2 = p.gry(p.GetBinY(tip.iy));
         tip.z1 = p.grz(p.GetBinZ(tip.iz-1));
         tip.z2 = p.grz(p.GetBinZ(tip.iz));
         tip.color = this.tip_color;
         tip.opacity = 0.3;

         return tip;
      }


      return true;
   }

   JSROOT.TH3Painter.prototype.Draw3DBins = function() {

      if (!this.draw_content) return;

      if (!this.options.Box && !this.options.GLBox && !this.options.GLColor && !this.options.Lego)
         if (this.Draw3DScatter()) return;

      var rootcolor = this.GetObject().fFillColor,
          fillcolor = JSROOT.Painter.root_colors[rootcolor],
          buffer_size = 0, use_lambert = false,
          use_helper = false, use_colors = false, use_opacity = 1, use_scale = true,
          single_bin_verts, single_bin_norms,
          box_option = this.options.Box,
          tipscale = 0.5;

      if (!box_option && this.options.Lego) box_option = (this.options.Lego===1) ? 10 : this.options.Lego;

      if ((this.options.GLBox === 11) || (this.options.GLBox === 12)) {

         tipscale = 0.4;
         use_lambert = true;
         if (this.options.GLBox === 12) use_colors = true;

         var geom = JSROOT.Painter.TestWebGL() ? new THREE.SphereGeometry(0.5, 16, 12) : new THREE.SphereGeometry(0.5, 8, 6);
         geom.applyMatrix( new THREE.Matrix4().makeRotationX( Math.PI / 2 ) );

         buffer_size = geom.faces.length*9;
         single_bin_verts = new Float32Array(buffer_size);
         single_bin_norms = new Float32Array(buffer_size);

         // Fill a typed array with cube geometry that will be shared by all
         // (This technically could be put into an InstancedBufferGeometry but
         // performance gain is likely not huge )
         for (var face = 0; face < geom.faces.length; ++face) {
            single_bin_verts[9*face  ] = geom.vertices[geom.faces[face].a].x;
            single_bin_verts[9*face+1] = geom.vertices[geom.faces[face].a].y;
            single_bin_verts[9*face+2] = geom.vertices[geom.faces[face].a].z;
            single_bin_verts[9*face+3] = geom.vertices[geom.faces[face].b].x;
            single_bin_verts[9*face+4] = geom.vertices[geom.faces[face].b].y;
            single_bin_verts[9*face+5] = geom.vertices[geom.faces[face].b].z;
            single_bin_verts[9*face+6] = geom.vertices[geom.faces[face].c].x;
            single_bin_verts[9*face+7] = geom.vertices[geom.faces[face].c].y;
            single_bin_verts[9*face+8] = geom.vertices[geom.faces[face].c].z;

            single_bin_norms[9*face  ] = geom.faces[face].vertexNormals[0].x;
            single_bin_norms[9*face+1] = geom.faces[face].vertexNormals[0].y;
            single_bin_norms[9*face+2] = geom.faces[face].vertexNormals[0].z;
            single_bin_norms[9*face+3] = geom.faces[face].vertexNormals[1].x;
            single_bin_norms[9*face+4] = geom.faces[face].vertexNormals[1].y;
            single_bin_norms[9*face+5] = geom.faces[face].vertexNormals[1].z;
            single_bin_norms[9*face+6] = geom.faces[face].vertexNormals[2].x;
            single_bin_norms[9*face+7] = geom.faces[face].vertexNormals[2].y;
            single_bin_norms[9*face+8] = geom.faces[face].vertexNormals[2].z;
         }

      } else {

         var indicies = JSROOT.Painter.Box_Indexes,
             normals = JSROOT.Painter.Box_Normals,
             vertices = JSROOT.Painter.Box_Vertices;

         buffer_size = indicies.length*3;
         single_bin_verts = new Float32Array(buffer_size);
         single_bin_norms = new Float32Array(buffer_size);

         for (var k=0,nn=-3;k<indicies.length;++k) {
            var vert = vertices[indicies[k]];
            single_bin_verts[k*3]   = vert.x-0.5;
            single_bin_verts[k*3+1] = vert.y-0.5;
            single_bin_verts[k*3+2] = vert.z-0.5;

            if (k%6===0) nn+=3;
            single_bin_norms[k*3]   = normals[nn];
            single_bin_norms[k*3+1] = normals[nn+1];
            single_bin_norms[k*3+2] = normals[nn+2];
         }
         use_helper = true;

         if (box_option===12) { use_colors = true; } else
         if (box_option===13) { use_colors = true; use_helper = false; }  else
         if (this.options.GLColor) { use_colors = true; use_opacity = 0.5; use_scale = false; use_helper = false; use_lambert = true; }
      }

      if (use_scale)
         use_scale = (this.gminbin || this.gmaxbin) ? 1 / Math.max(Math.abs(this.gminbin), Math.abs(this.gmaxbin)) : 1;

      var histo = this.GetObject(),
          i1 = this.GetSelectIndex("x", "left", 0.5),
          i2 = this.GetSelectIndex("x", "right", 0),
          j1 = this.GetSelectIndex("y", "left", 0.5),
          j2 = this.GetSelectIndex("y", "right", 0),
          k1 = this.GetSelectIndex("z", "left", 0.5),
          k2 = this.GetSelectIndex("z", "right", 0),
          name = this.GetTipName("<br/>");

      if ((i2<=i1) || (j2<=j1) || (k2<=k1)) return;

      var scalex = (this.grx(this.GetBinX(i2)) - this.grx(this.GetBinX(i1))) / (i2-i1),
          scaley = (this.gry(this.GetBinY(j2)) - this.gry(this.GetBinY(j1))) / (j2-j1),
          scalez = (this.grz(this.GetBinZ(k2)) - this.grz(this.GetBinZ(k1))) / (k2-k1);

      var nbins = 0, i, j, k, wei, bin_content, cols_size = [], num_colors = 0, cols_sequence = [];

      for (i = i1; i < i2; ++i) {
         for (j = j1; j < j2; ++j) {
            for (k = k1; k < k2; ++k) {
               bin_content = histo.getBinContent(i+1, j+1, k+1);
               if ((bin_content===0) || (bin_content < this.gminbin)) continue;
               wei = use_scale ? Math.pow(Math.abs(bin_content*use_scale), 0.3333) : 1;
               if (wei < 1e-3) continue; // do not draw empty or very small bins

               nbins++;

               if (!use_colors) continue;

               var colindx = this.getValueColor(bin_content, true);
               if (colindx != null) {
                  if (cols_size[colindx] === undefined) {
                     cols_size[colindx] = 0;
                     cols_sequence[colindx] = num_colors++;
                  }
                  cols_size[colindx]+=1;
               } else {
                  console.error('not found color for', bin_content);
               }
            }
         }
      }

      if (!use_colors) {
         cols_size.push(nbins);
         num_colors = 1;
         cols_sequence = [0];
      }

      var cols_nbins = new Array(num_colors),
          bin_verts = new Array(num_colors),
          bin_norms = new Array(num_colors),
          bin_tooltips = new Array(num_colors),
          helper_kind = new Array(num_colors),
          helper_indexes = new Array(num_colors),  // helper_kind == 1, use original vertices
          helper_positions = new Array(num_colors);  // helper_kind == 2, all vertices copied into separate buffer

      for(var ncol=0;ncol<cols_size.length;++ncol) {
         if (!cols_size[ncol]) continue; // ignore dummy colors

         nbins = cols_size[ncol]; // how many bins with specified color
         var nseq = cols_sequence[ncol];

         cols_nbins[nseq] = 0; // counter for the filled bins

         helper_kind[nseq] = 0;

         // 1 - use same vertices to create helper, one can use maximal 64K vertices
         // 2 - all vertices copied into separate buffer
         if (use_helper)
            helper_kind[nseq] = (nbins * buffer_size / 3 > 0xFFF0) ? 2 : 1;

         bin_verts[nseq] = new Float32Array(nbins * buffer_size);
         bin_norms[nseq] = new Float32Array(nbins * buffer_size);
         bin_tooltips[nseq] = new Int32Array(nbins);

         if (helper_kind[nseq]===1)
            helper_indexes[nseq] = new Uint16Array(nbins * JSROOT.Painter.Box_MeshSegments.length);

         if (helper_kind[nseq]===2)
            helper_positions[nseq] = new Float32Array(nbins * JSROOT.Painter.Box_Segments.length * 3);
      }

      var binx, grx, biny, gry, binz, grz;

      for (i = i1; i < i2; ++i) {
         binx = this.GetBinX(i+0.5); grx = this.grx(binx);
         for (j = j1; j < j2; ++j) {
            biny = this.GetBinY(j+0.5); gry = this.gry(biny);
            for (k = k1; k < k2; ++k) {
               bin_content = histo.getBinContent(i+1, j+1, k+1);
               if ((bin_content===0) || (bin_content < this.gminbin)) continue;

               wei = use_scale ? Math.pow(Math.abs(bin_content*use_scale), 0.3333) : 1;
               if (wei < 1e-3) continue; // do not show very small bins

               var nseq = 0;
               if (use_colors) {
                  var colindx = this.getValueColor(bin_content, true);
                  if (colindx === null) continue;
                  nseq = cols_sequence[colindx];
               }

               nbins = cols_nbins[nseq];

               binz = this.GetBinZ(k+0.5); grz = this.grz(binz);

               // remeber bin index for tooltip
               bin_tooltips[nseq][nbins] = histo.getBin(i+1, j+1, k+1);

               var vvv = nbins * buffer_size, bin_v = bin_verts[nseq], bin_n = bin_norms[nseq];

               // Grab the coordinates and scale that are being assigned to each bin
               for (var vi = 0; vi < buffer_size; vi+=3, vvv+=3) {
                  bin_v[vvv]   = grx + single_bin_verts[vi]*scalex*wei;
                  bin_v[vvv+1] = gry + single_bin_verts[vi+1]*scaley*wei;
                  bin_v[vvv+2] = grz + single_bin_verts[vi+2]*scalez*wei;

                  bin_n[vvv]   = single_bin_norms[vi];
                  bin_n[vvv+1] = single_bin_norms[vi+1];
                  bin_n[vvv+2] = single_bin_norms[vi+2];
               }

               if (helper_kind[nseq]===1) {
                  // reuse vertices created for the mesh
                  var helper_segments = JSROOT.Painter.Box_MeshSegments;
                  vvv = nbins * helper_segments.length;
                  var shift = Math.round(nbins * buffer_size/3),
                      helper_i = helper_indexes[nseq];
                  for (var n=0;n<helper_segments.length;++n)
                     helper_i[vvv+n] = shift + helper_segments[n];
               }

               if (helper_kind[nseq]===2) {
                  var helper_segments = JSROOT.Painter.Box_Segments,
                      helper_p = helper_positions[nseq];
                  vvv = nbins * helper_segments.length * 3;
                  for (var n=0;n<helper_segments.length;++n, vvv+=3) {
                     var vert = JSROOT.Painter.Box_Vertices[helper_segments[n]];
                     helper_p[vvv]   = grx + (vert.x-0.5)*scalex*wei;
                     helper_p[vvv+1] = gry + (vert.y-0.5)*scaley*wei;
                     helper_p[vvv+2] = grz + (vert.z-0.5)*scalez*wei;
                  }
               }

               cols_nbins[nseq] = nbins+1;
            }
         }
      }

      for(var ncol=0;ncol<cols_size.length;++ncol) {
         if (!cols_size[ncol]) continue; // ignore dummy colors

         nbins = cols_size[ncol]; // how many bins with specified color
         var nseq = cols_sequence[ncol];

         // BufferGeometries that store geometry of all bins
         var all_bins_buffgeom = new THREE.BufferGeometry();

         // Create mesh from bin buffergeometry
         all_bins_buffgeom.addAttribute('position', new THREE.BufferAttribute( bin_verts[nseq], 3 ) );
         all_bins_buffgeom.addAttribute('normal', new THREE.BufferAttribute( bin_norms[nseq], 3 ) );

         if (use_colors) fillcolor = this.fPalette[ncol];

         var material = use_lambert ? new THREE.MeshLambertMaterial({ color: fillcolor, opacity: use_opacity, transparent: (use_opacity<1) })
                                    : new THREE.MeshBasicMaterial({ color: fillcolor, opacity: use_opacity });

         var combined_bins = new THREE.Mesh(all_bins_buffgeom, material);

         combined_bins.bins = bin_tooltips[nseq];
         combined_bins.bins_faces = buffer_size/3;
         combined_bins.painter = this;

         combined_bins.scalex = tipscale*scalex;
         combined_bins.scaley = tipscale*scaley;
         combined_bins.scalez = tipscale*scalez;
         combined_bins.tip_color = (rootcolor===3) ? 0xFF0000 : 0x00FF00;
         combined_bins.use_scale = use_scale;

         combined_bins.tooltip = function(intersect) {
            var indx = Math.floor(intersect.index / this.bins_faces);
            if ((indx<0) || (indx >= this.bins.length)) return null;

            var p = this.painter,
                tip = p.Get3DToolTip(this.bins[indx]),
                grx = p.grx(p.GetBinX(tip.ix-0.5)),
                gry = p.gry(p.GetBinY(tip.iy-0.5)),
                grz = p.grz(p.GetBinZ(tip.iz-0.5)),
                wei = this.use_scale ? Math.pow(Math.abs(tip.value*this.use_scale), 0.3333) : 1;

            tip.x1 = grx - this.scalex*wei; tip.x2 = grx + this.scalex*wei;
            tip.y1 = gry - this.scaley*wei; tip.y2 = gry + this.scaley*wei;
            tip.z1 = grz - this.scalez*wei; tip.z2 = grz + this.scalez*wei;

            tip.color = this.tip_color;

            return tip;
         }

         this.toplevel.add(combined_bins);

         if (helper_kind[nseq] > 0) {
            var helper_geom = new THREE.BufferGeometry();

            if (helper_kind[nseq] === 1) {
               // reuse positions from the mesh - only special index was created
               helper_geom.setIndex(  new THREE.BufferAttribute(helper_indexes[nseq], 1) );
               helper_geom.addAttribute( 'position', new THREE.BufferAttribute( bin_verts[nseq], 3 ) );
            } else {
               helper_geom.addAttribute( 'position', new THREE.BufferAttribute( helper_positions[nseq], 3 ) );
            }

            var lcolor = JSROOT.Painter.root_colors[this.GetObject().fLineColor],
                helper_material = new THREE.LineBasicMaterial( { color: lcolor } ),
                lines = new THREE.LineSegments(helper_geom, helper_material );

            this.toplevel.add(lines);
         }
      }
   }

   JSROOT.TH3Painter.prototype.Redraw = function(resize) {
      if (resize) {

         if (this.Resize3D()) this.Render3D();

      } else {

         this.Create3DScene();
         this.DrawXYZ(this.toplevel, { zoom: JSROOT.gStyle.Zooming });
         this.Draw3DBins();
         this.Render3D();
         this.UpdateStatWebCanvas();
         this.AddKeysHandler();

      }
      this.DrawTitle();
   }

   JSROOT.TH3Painter.prototype.FillToolbar = function() {
      var pp = this.pad_painter(true);
      if (pp===null) return;

      pp.AddButton(JSROOT.ToolbarIcons.auto_zoom, 'Unzoom all axes', 'ToggleZoom', "Ctrl *");
      if (this.draw_content)
         pp.AddButton(JSROOT.ToolbarIcons.statbox, 'Toggle stat box', "ToggleStatBox");
   }

   JSROOT.TH3Painter.prototype.CanZoomIn = function(axis,min,max) {
      // check if it makes sense to zoom inside specified axis range

      if ((axis=="x") && (this.GetIndexX(max,0.5) - this.GetIndexX(min,0) > 1)) return true;

      if ((axis=="y") && (this.GetIndexY(max,0.5) - this.GetIndexY(min,0) > 1)) return true;

      if ((axis=="z") && (this.GetIndexZ(max,0.5) - this.GetIndexZ(min,0) > 1)) return true;

      return false;
   }

   JSROOT.TH3Painter.prototype.AutoZoom = function() {
      var i1 = this.GetSelectIndex("x", "left"),
          i2 = this.GetSelectIndex("x", "right"),
          j1 = this.GetSelectIndex("y", "left"),
          j2 = this.GetSelectIndex("y", "right"),
          k1 = this.GetSelectIndex("z", "left"),
          k2 = this.GetSelectIndex("z", "right"),
          i,j,k, histo = this.GetObject();

      if ((i1 === i2) || (j1 === j2) || (k1 === k2)) return;

      // first find minimum
      var min = histo.getBinContent(i1 + 1, j1 + 1, k1+1);
      for (i = i1; i < i2; ++i)
         for (j = j1; j < j2; ++j)
            for (k = k1; k < k2; ++k)
               min = Math.min(min, histo.getBinContent(i+1, j+1, k+1));

      if (min>0) return; // if all points positive, no chance for autoscale

      var ileft = i2, iright = i1, jleft = j2, jright = j1, kleft = k2, kright = k1;

      for (i = i1; i < i2; ++i)
         for (j = j1; j < j2; ++j)
            for (k = k1; k < k2; ++k)
               if (histo.getBinContent(i+1, j+1, k+1) > min) {
                  if (i < ileft) ileft = i;
                  if (i >= iright) iright = i + 1;
                  if (j < jleft) jleft = j;
                  if (j >= jright) jright = j + 1;
                  if (k < kleft) kleft = k;
                  if (k >= kright) kright = k + 1;
               }

      var xmin, xmax, ymin, ymax, zmin, zmax, isany = false;

      if ((ileft === iright-1) && (ileft > i1+1) && (iright < i2-1)) { ileft--; iright++; }
      if ((jleft === jright-1) && (jleft > j1+1) && (jright < j2-1)) { jleft--; jright++; }
      if ((kleft === kright-1) && (kleft > k1+1) && (kright < k2-1)) { kleft--; kright++; }

      if ((ileft > i1 || iright < i2) && (ileft < iright - 1)) {
         xmin = this.GetBinX(ileft);
         xmax = this.GetBinX(iright);
         isany = true;
      }

      if ((jleft > j1 || jright < j2) && (jleft < jright - 1)) {
         ymin = this.GetBinY(jleft);
         ymax = this.GetBinY(jright);
         isany = true;
      }

      if ((kleft > k1 || kright < k2) && (kleft < kright - 1)) {
         zmin = this.GetBinZ(kleft);
         zmax = this.GetBinZ(kright);
         isany = true;
      }

      if (isany) this.Zoom(xmin, xmax, ymin, ymax, zmin, zmax);
   }


   JSROOT.TH3Painter.prototype.FillHistContextMenu = function(menu) {

      var sett = JSROOT.getDrawSettings("ROOT." + this.GetObject()._typename, 'nosame');

      menu.addDrawMenu("Draw with", sett.opts, function(arg) {
         if (arg==='inspect')
            return JSROOT.draw(this.divid, this.GetObject(),arg);

         this.options = this.DecodeOptions(arg);
         this.Redraw();
      });
   }

   JSROOT.Painter.drawHistogram3D = function(divid, histo, opt) {
      // when called, *this* set to painter instance

      // create painter and add it to canvas
      JSROOT.extend(this, new JSROOT.TH3Painter(histo));

      this.SetDivId(divid, 4);

      this.options = this.DecodeOptions(opt);

      this.CheckPadRange();

      this.ScanContent();

      this.Redraw();

      if (JSROOT.gStyle.AutoStat && (this.create_canvas || histo.$snapid)) {
         var stats = this.CreateStat(histo.$custom_stat);
         if (stats) JSROOT.draw(this.divid, stats, "");
      }

      this.FillToolbar();

      return this.DrawingReady();
   }

   // ===================================================================

   JSROOT.Painter.drawPolyMarker3D = function(divid, poly, opt) {
      // when called, *this* set to painter instance

      this.SetDivId(divid);

      this.Redraw = function() {

         var main = this.main_painter();

         if (!main  || !('renderer' in main)) return;

         var step = 1, sizelimit = main.webgl ? 50000 : 5000, numselect = 0;

         for (var i=0;i<poly.fP.length;i+=3) {
            if ((poly.fP[i] < main.scale_xmin) || (poly.fP[i] > main.scale_xmax) ||
                (poly.fP[i+1] < main.scale_ymin) || (poly.fP[i+1] > main.scale_ymax) ||
                (poly.fP[i+2] < main.scale_zmin) || (poly.fP[i+2] > main.scale_zmax)) continue;
            ++numselect;
         }

         if ((JSROOT.gStyle.OptimizeDraw > 0) && (numselect > sizelimit)) {
            step = Math.floor(numselect/sizelimit);
            if (step <= 2) step = 2;
         }

         var size = Math.floor(numselect/step),
             pnts = new JSROOT.Painter.PointsCreator(size, main.webgl, main.size_xy3d/100),
             index = new Int32Array(size),
             select = 0, icnt = 0;

         for (var i=0; i < poly.fP.length;i+=3) {

            if ((poly.fP[i] < main.scale_xmin) || (poly.fP[i] > main.scale_xmax) ||
                (poly.fP[i+1] < main.scale_ymin) || (poly.fP[i+1] > main.scale_ymax) ||
                (poly.fP[i+2] < main.scale_zmin) || (poly.fP[i+2] > main.scale_zmax)) continue;

            if (step > 1) {
               select = (select+1) % step;
               if (select!==0) continue;
            }

            index[icnt++] = i;

            pnts.AddPoint(main.grx(poly.fP[i]), main.gry(poly.fP[i+1]), main.grz(poly.fP[i+2]));
         }

         var mesh = pnts.CreateMesh(JSROOT.Painter.root_colors[poly.fMarkerColor]);

         main.toplevel.add(mesh);

         mesh.tip_color = (poly.fMarkerColor === 3) ? 0xFF0000 : 0x00FF00;
         mesh.poly = poly;
         mesh.painter = main;
         mesh.scale0 = 0.7*pnts.scale;
         mesh.index = index;

         mesh.tooltip = function(intersect) {
            var indx = Math.floor(intersect.index / this.nvertex);
            if ((indx<0) || (indx >= this.index.length)) return null;

            indx = this.index[indx];

            var p = this.painter;

            var tip = { info: "bin: " + indx/3 + "<br/>" +
                  "x: " + p.x_handle.format(this.poly.fP[indx]) + "<br/>" +
                  "y: " + p.y_handle.format(this.poly.fP[indx+1]) + "<br/>" +
                  "z: " + p.z_handle.format(this.poly.fP[indx+2]) };

            var grx = p.grx(this.poly.fP[indx]),
                gry = p.gry(this.poly.fP[indx+1]),
                grz = p.grz(this.poly.fP[indx+2]);

            tip.x1 = grx - this.scale0; tip.x2 = grx + this.scale0;
            tip.y1 = gry - this.scale0; tip.y2 = gry + this.scale0;
            tip.z1 = grz - this.scale0; tip.z2 = grz + this.scale0;

            tip.color = this.tip_color;

            return tip;
         }

         main.Render3D(100); // set large timeout to be able draw other points
      }

      this.Redraw();

      return this.DrawingReady();
   }

   return JSROOT.Painter;

}));

