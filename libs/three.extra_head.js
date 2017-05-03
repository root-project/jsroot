// Collection of additional THREE.js classes, required in JSROOT

(function( factory ) {
   if ( typeof define === "function" && define.amd ) {
      // AMD. Register as an anonymous module.
      define( ['JSRootCore', 'threejs'], factory );
   } else
   if (typeof exports === 'object' && typeof module !== 'undefined') {
      var jsroot = require("./JSRootCore.js");
      factory(jsroot, require("./three.min.js"), jsroot.nodejs || (typeof document=='undefined') ? jsroot.nodejs_document : document);
   } else {

      if (typeof JSROOT == 'undefined')
         throw new Error('JSROOT is not defined', 'three.extra.js');

      if (typeof THREE == 'undefined')
         throw new Error('THREE is not defined', 'three.extra.js');

      factory(JSROOT, THREE, document);
   }
} (function(JSROOT, THREE, document) {

   if ((typeof document=='undefined') && (typeof window=='object')) document = window.document;

   // ========================== temporary here, later move to three.extra.js =============================


   THREE.RenderableFaceNew = function () {
      // compact form with plain array for all important attributes

      this.id = 0;
      this.z = 0;
      this.renderOrder = 0;
      this.x1 = this.y1 = this.x2 = this.y2 = this.x3 = this.y3;
   };

   THREE.RenderableLineNew = function () {
      // compact form with plain array for all important attributes

      this.id = 0;
      this.z = 0;
      this.renderOrder = 0;
      this.x1 = this.y1 = this.x2 = this.y2 = 0;
   };

   var gdebug = false;

   THREE.ProjectorNew = function () {

      var _object, _objectCount, _objectPool = [], _objectPoolLength = 0,
         _vertex, _vertexCount, _vertexPool = [], _vertexPoolLength = 0,
         _face, _faceCount, _facePool = [], _facePoolLength = 0,
         _line, _lineCount, _linePool = [], _linePoolLength = 0,
         _sprite, _spriteCount, _spritePool = [], _spritePoolLength = 0,
         _vertex1, _vertex2, _vertex3, _debug = 0,

         _renderData = { objects: [], /*lights: [],*/ elements: [] },

         _vector3 = new THREE.Vector3(),
         _normal = new THREE.Vector3(),
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

         function pushLineNew(pos, ia, ib) {
            if (!_vertex1) _vertex1 = getNextVertexInPool();
            if (!_vertex2) _vertex2 = getNextVertexInPool();

            _vertex1.position.set( pos[ia], pos[ia+1], pos[ia+2]);
            _vertex2.position.set( pos[ib], pos[ib+1], pos[ib+2]);

            _vertex1.positionScreen.copy( _vertex1.position ).applyMatrix4( _modelViewProjectionMatrix );
            _vertex2.positionScreen.copy( _vertex2.position ).applyMatrix4( _modelViewProjectionMatrix );

            if ( clipLine( _vertex1.positionScreen, _vertex2.positionScreen ) === true ) {

               // Perform the perspective divide
               _vertex1.positionScreen.multiplyScalar( 1 / _vertex1.positionScreen.w );
               _vertex2.positionScreen.multiplyScalar( 1 / _vertex2.positionScreen.w );

               _line = new THREE.RenderableLineNew();
               _line.id = object.id;
               _line.x1 = _vertex1.positionScreen.x;
               _line.y1 = _vertex1.positionScreen.y;
               _line.x2 = _vertex2.positionScreen.x;
               _line.y2 = _vertex2.positionScreen.y;

               _line.z = Math.max( _vertex1.positionScreen.z, _vertex2.positionScreen.z );
               _line.renderOrder = object.renderOrder;

               _line.material = object.material;

               // TODO: copy individual vertex colors, not used in JSROOT
               //if ( object.material.vertexColors === THREE.VertexColors ) {
                  // _line.vertexColors[ 0 ].fromArray( colors, a * 3 );
                  // _line.vertexColors[ 1 ].fromArray( colors, b * 3 );
               //}

              _renderData.elements.push( _line );
            }

         }


         function pushTriangle( a, b, c ) {

            var v1 = _vertexPool[ a ],
                v2 = _vertexPool[ b ],
                v3 = _vertexPool[ c ];

            if ( checkTriangleVisibility( v1, v2, v3 ) === false ) return;

            if ( material.side === THREE.DoubleSide || checkBackfaceCulling( v1, v2, v3 ) === true ) {

               _face = getNextFaceInPool();

               _face.id = object.id;
               _face.v1.copy( v1 );
               _face.v2.copy( v2 );
               _face.v3.copy( v3 );
               _face.z = ( v1.positionScreen.z + v2.positionScreen.z + v3.positionScreen.z ) / 3;
               _face.renderOrder = object.renderOrder;

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

         function pushTriangleNew(pos, norm, ia, ib, ic, calculateFaceColor ) {
            if (!_vertex1) _vertex1 = getNextVertexInPool();
            if (!_vertex2) _vertex2 = getNextVertexInPool();
            if (!_vertex3) _vertex3 = getNextVertexInPool();

            _vertex1.position.set( pos[ia], pos[ia+1], pos[ia+2]);
            projectVertex( _vertex1 );

            _vertex2.position.set( pos[ib], pos[ib+1], pos[ib+2]);
            projectVertex( _vertex2 );

            _vertex3.position.set( pos[ic], pos[ic+1], pos[ic+2]);
            projectVertex( _vertex3 );

            if ( checkTriangleVisibility( _vertex1, _vertex2, _vertex3 ) === false ) return;

            if ( material.side === THREE.DoubleSide || checkBackfaceCulling( _vertex1, _vertex2, _vertex3 ) === true ) {

               _face = new THREE.RenderableFaceNew();

               _face.id = object.id;
               _face.z = ( _vertex1.positionScreen.z + _vertex2.positionScreen.z + _vertex3.positionScreen.z ) / 3;
               _face.renderOrder = object.renderOrder;

               _face.x1 = _vertex1.positionScreen.x;
               _face.y1 = _vertex1.positionScreen.y;
               _face.x2 = _vertex2.positionScreen.x;
               _face.y2 = _vertex2.positionScreen.y;
               _face.x3 = _vertex3.positionScreen.x;
               _face.y3 = _vertex3.positionScreen.y;

               // TODO: copy positionWorld for some special materials

               _face.material = object.material;
               _face.color = calculateFaceColor(object.material, _vertex1, _vertex2, _vertex3, null, function() {
                  // normal required only for color calculation for some materials
                  _normal.set(norm[ia], norm[ia+1], norm[ia+2]);
                  _normal.applyMatrix3( normalMatrix ).normalize();
                  return _normal;
               });

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
            pushLineNew: pushLineNew,
            pushTriangle: pushTriangle,
            pushTriangleNew: pushTriangleNew
         };

      };

      var renderList = new RenderListNew();

      function projectObject( object ) {

         if ( object.visible === false ) return;

         if ( object instanceof THREE.Light ) {

            // _renderData.lights.push( object );

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

      this.extractLights = function (scene) {
         // make extra function to extract lights before projecting scene
         // lights used for colors calculations of some materials

         var lights = [];

         scene.traverse(function(object) {
            if ( object.visible === false ) return;
            if ( object instanceof THREE.Light ) lights.push(object);
         });

         return lights;
      }


      this.projectScene = function ( scene, camera, sortObjects, sortElements, calculateFaceColor ) {

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
         // _renderData.lights.length = 0;

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
                           renderList.pushTriangleNew(positions, normals, indices[ i ], indices[ i + 1 ], indices[ i + 2 ], calculateFaceColor );
                        }

                     } else {

                         // without index
                         for ( var i = 0, l = positions.length; i < l; i += 9 ) {
                           renderList.pushTriangleNew(positions, normals, i, i + 3, i + 6, calculateFaceColor );
                        }
                     }

                     continue;
                  }

                  throw new Error('HERE');



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

                        for ( var g = 0; g < groups.length; g ++ ) {

                           var group = groups[ g ];

                           for ( var i = group.start, l = group.start + group.count; i < l; i += 3 ) {

                              renderList.pushTriangle( indices[ i ], indices[ i + 1 ], indices[ i + 2 ] );

                           }

                        }

                     } else {

                        for ( var i = 0, l = indices.length; i < l; i += 3 ) {

                           renderList.pushTriangle( indices[ i ], indices[ i + 1 ], indices[ i + 2 ] );

                        }

                     }

                  } else {

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

                     _face = new THREE.RenderableFaceNew();

                     _face.id = object.id;
                     _face.x1 = v1.positionScreen.x;
                     _face.y1 = v1.positionScreen.y;
                     _face.x2 = v2.positionScreen.x;
                     _face.y2 = v2.positionScreen.y;
                     _face.x3 = v3.positionScreen.x;
                     _face.y3 = v3.positionScreen.y;

                     // use first vertex normal as face normal, can improve later

                     _face.material = material;
                     _face.color = calculateFaceColor(material, v1, v2, v3, face, function() {
                        // normal required only for color calculation for some materials
                        _normal.copy(face.normal);
                        if ( visible === false && ( side === THREE.BackSide || side === THREE.DoubleSide ) ) {
                           _normal.negate();
                        }
                        _normal.applyMatrix3( normalMatrix ).normalize();
                        return _normal;
                     });

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

                     if ( geometry.index !== null ) {

                        var indices = geometry.index.array;

                        for ( var i = 0, l = indices.length; i < l; i += 2 ) {
                           renderList.pushLineNew(positions,  indices[ i ]*3, indices[ i + 1 ]*3 );
                        }

                     } else {

                        var step = object instanceof THREE.LineSegments ? 6 : 3;

                        for ( var i = 0, l = positions.length - 3; i < l; i += step ) {
                           renderList.pushLineNew( positions, i, i + 3 );
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

                        _line = new THREE.RenderableLineNew();

                        _line.id = object.id;

                        _line.x1 = _clippedVertex1PositionScreen.x;
                        _line.y1 = _clippedVertex1PositionScreen.y;
                        _line.x2 = _clippedVertex2PositionScreen.x;
                        _line.y2 = _clippedVertex2PositionScreen.y;

                        _line.z = Math.max( _clippedVertex1PositionScreen.z, _clippedVertex2PositionScreen.z );
                        _line.renderOrder = object.renderOrder;

                        _line.material = object.material;

                        // TODO: use vertex colors for the future
                        //if ( object.material.vertexColors === THREE.VertexColors ) {
                        //   _line.vertexColors[ 0 ].copy( object.geometry.colors[ v ] );
                        //   _line.vertexColors[ 1 ].copy( object.geometry.colors[ v - 1 ] );
                        //}

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
      _quality = 1, _curr_style, _curr_path, _num_same, _curr_svg_x, _curr_svg_y;

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

         // extract lights before projecting scene
         _lights = _projector.extractLights ( scene );
         calculateLights( _lights );

         _renderData = _projector.projectScene( scene, camera, this.sortObjects, this.sortElements, calculateFaceColor );
         _elements = _renderData.elements;

         _normalViewMatrix.getNormalMatrix( camera.matrixWorldInverse );

         _curr_style = ""; _curr_path = ""; _num_same = 0; _curr_svg_x = null; _curr_svg_y = null;

         for ( var e = 0, el = _elements.length; e < el; e ++ ) {

            var element = _elements[ e ],
                material = element.material;

            if ( material === undefined || material.opacity === 0 ) continue;

            // disable _elemBox check, while all checks already done
            // _elemBox.makeEmpty();

            if ( element instanceof THREE.RenderableFaceNew ) {

               element.x1 *= _svgWidthHalf;
               element.y1 *= -_svgHeightHalf;
               element.x2 *= _svgWidthHalf;
               element.y2 *= -_svgHeightHalf;
               element.x3 *= _svgWidthHalf;
               element.y3 *= -_svgHeightHalf;
               renderFace3New( element, material );
               continue;

               // non-useful code, all projections already checked against frustum
               _elemBox.min.x = Math.min(element.x1, element.x2, element.x3);
               _elemBox.max.x = Math.max(element.x1, element.x2, element.x3);
               _elemBox.min.y = Math.min(element.y1, element.y2, element.y3);
               _elemBox.max.y = Math.max(element.y1, element.y2, element.y3);

               if ( _clipBox.intersectsBox( _elemBox ) === true ) {
                  renderFace3New( element, material );
               }

            } else if (element instanceof THREE.RenderableLineNew) {
               element.x1 *= _svgWidthHalf; element.y1 *= -_svgHeightHalf;
               element.x2 *= _svgWidthHalf; element.y2 *= -_svgHeightHalf;
               renderLineNew( element, material );
               continue;

               // non-useful code, all projections already checked against frustum
               _elemBox.min.x = Math.min(element.x1, element.x2);
               _elemBox.max.x = Math.max(element.x1, element.x2);
               _elemBox.min.y = Math.min(element.y1, element.y2);
               _elemBox.max.y = Math.max(element.y1, element.y2);

               if ( _clipBox.intersectsBox( _elemBox ) === true ) {
                  renderLineNew( element, material );
               }

            } else
            if ( element instanceof THREE.RenderableSprite ) {

               console.log('ignore THREE.RenderableSprite');
               continue;

               _v1 = element;
               _v1.x *= _svgWidthHalf; _v1.y *= - _svgHeightHalf;

               renderSprite( _v1, element, material );

            } else if ( element instanceof THREE.RenderableLine ) {

               console.log('ignore THREE.RenderableLine');
               continue;

               _v1 = element.v1; _v2 = element.v2;

               _v1.positionScreen.x *= _svgWidthHalf; _v1.positionScreen.y *= - _svgHeightHalf;
               _v2.positionScreen.x *= _svgWidthHalf; _v2.positionScreen.y *= - _svgHeightHalf;

               _elemBox.setFromPoints( [ _v1.positionScreen, _v2.positionScreen ] );

               if ( _clipBox.intersectsBox( _elemBox ) === true ) {

                  renderLine( _v1, _v2, element, material );

               }

            } else if ( element instanceof THREE.RenderableFace ) {

               console.log('ignore THREE.RenderableFace');
               continue;

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

         checkCurrentPath();

         console.log('Num same', _num_same, 'total', _elements.length);

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

      function checkCurrentPath(new_style) {

         if (_curr_style==new_style) _num_same++; else {
            if (_curr_path && _curr_style) {
               _svgNode = getPathNode( _pathCount ++ );
               _svgNode.setAttribute('d', _curr_path);
               _svgNode.setAttribute('style', _curr_style);
               _svg.appendChild( _svgNode );
            }
            _curr_path = "";
            _curr_style = new_style;
            _curr_svg_x = null;
            _curr_svg_y = null;
         }
      }

      function svg_position(x,y) {
         _curr_path += "M"+x+","+y;
         _curr_svg_x = x;
         _curr_svg_y = y;
      }

      function svg_line(x,y) {
         if (_curr_svg_x === x) _curr_path += "v" + (y-_curr_svg_y); else
         if (_curr_svg_y === y) _curr_path += "h" + (x-_curr_svg_x); else
              _curr_path += "l"+(x-_curr_svg_x)+","+(y-_curr_svg_y);
         _curr_svg_x = x;
         _curr_svg_y = y;
      }

      function svg_close() {
         _curr_path += "Z";
      }

      function renderLineNew( element, material ) {

         if ( material instanceof THREE.LineBasicMaterial ) {

            // many attributes are useless for the single line - suppress them
            // _svgNode.setAttribute( 'style', 'fill: none; stroke: ' + material.color.getStyle() + '; stroke-width: ' + material.linewidth + '; stroke-opacity: ' + material.opacity + '; stroke-linecap: ' + material.linecap + '; stroke-linejoin: ' + material.linejoin );

            var style = 'fill:none;stroke:' + material.color.getStyle();
            if (material.linewidth!==1) style+=';stroke-width:' + material.linewidth;
            if (material.opacity!==1) style += ';stroke-opacity:' + material.opacity.toFixed(3);

            checkCurrentPath(style);

            svg_position(Math.round(element.x1),Math.round(element.y1));
            svg_line(Math.round(element.x2),Math.round(element.y2));
         }

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

      function calculateFaceColor(material, v1,v2,v3, element, getNormalModel) {
         // make special function, which is provided to projector
         // try to calculate face color when do projection
         // most of normals are not interesting at all

         if ( material instanceof THREE.MeshBasicMaterial ) {

            if (( material.vertexColors === THREE.FaceColors ) && element) {
               _color.copy( material.color );
               _color.multiply( element.color );
               return _color.getStyle();
            }

            return undefined; // means material color

         } else if ( material instanceof THREE.MeshLambertMaterial || material instanceof THREE.MeshPhongMaterial ) {

            _diffuseColor.copy( material.color );

            if (( material.vertexColors === THREE.FaceColors ) && element) {
               _diffuseColor.multiply( element.color );
            }

            _color.copy( _ambientLight );

            _centroid.copy( v1.positionWorld ).add( v2.positionWorld ).add( v3.positionWorld ).divideScalar( 3 );

            calculateLight( _lights, _centroid, getNormalModel(), _color );

            _color.multiply( _diffuseColor ).add( material.emissive );

            return _color.getStyle();

         } else if ( material instanceof THREE.MeshNormalMaterial ) {

            _normal.copy( getNormalModel() ).applyMatrix3( _normalViewMatrix );

            _color.setRGB( _normal.x, _normal.y, _normal.z ).multiplyScalar( 0.5 ).addScalar( 0.5 );

            return _color.getStyle();
         }
         return undefined; // use material color by default
      }

      function renderFace3New( element, material ) {

         _this.info.render.vertices += 3;
         _this.info.render.faces ++;

         var col = element.color;
         if (!col) col = material.color.getStyle();

         var style = "";

         if ( material.wireframe ) {

            style = 'fill:none;stroke:' + col + ';stroke-width:' + material.wireframeLinewidth + '; stroke-opacity: ' + material.opacity + ';stroke-linecap:' + material.wireframeLinecap + ';stroke-linejoin:' + material.wireframeLinejoin;

         } else {

            style = 'fill:' + col;
            if (material.opacity!==1) style+=';fill-opacity:' + material.opacity.toFixed(3);
         }

         checkCurrentPath(style);

         svg_position(Math.round(element.x1), Math.round(element.y1));
         svg_line(Math.round(element.x2), Math.round(element.y2));
         svg_line(Math.round(element.x3), Math.round(element.y3));
         svg_close();
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

   // ===============================================================

   // Small initialisation part for used THREE font
   JSROOT.threejs_font_helvetiker_regular = new THREE.Font(
