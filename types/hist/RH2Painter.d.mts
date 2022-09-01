export class RH2Painter extends RH2Painter2D {
    /** Draw histogram bins in 3D, using provided draw options */
    draw3DBins(): void;
    draw3D(reason: any): Promise<RH2Painter>;
}
import { RH2Painter as RH2Painter2D } from "../hist2d/RH2Painter.mjs";
