/// 3D TH2 drawing

import { gStyle, BIT, settings, constants, createHistogram, isBatchMode, getDocument } from '../core.mjs';

import { rgb as d3_rgb } from '../d3.mjs';

import { REVISION, DoubleSide, Object3D, Color, Vector2, Vector3, Matrix4, Line3,
         BufferGeometry, BufferAttribute, Mesh, MeshBasicMaterial, MeshLambertMaterial,
         LineSegments, LineDashedMaterial, LineBasicMaterial,
         TextGeometry, SphereGeometry, ShapeUtils,
         Plane, Scene, PerspectiveCamera, PointLight } from '../three.mjs';

import { ObjectPainter } from '../base/ObjectPainter.mjs';

import { TAttMarkerHandler } from '../base/TAttMarkerHandler.mjs';

import { DrawOptions, TRandom, floatToString } from '../painter.mjs';

import { getDrawSettings, draw } from '../draw.mjs';

import { TAxisPainter, TFramePainter, EAxisBits, ensureTCanvas } from '../gpad.mjs';

import { assign3DHandler, disposeThreejsObject, createOrbitControl,
         createLineSegments, create3DLineMaterial, PointsCreator, Box3D,
         createRender3D, beforeRender3D, afterRender3D, getRender3DKind,
         cleanupRender3D, HelveticerRegularFont, createSVGRenderer } from '../base3d.mjs';

import { translateLaTeX } from '../latex.mjs';

import { THistPainter, TH1Painter, TH2Painter } from '../hist/THistPainter.mjs';

