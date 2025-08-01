import { version, gStyle, httpRequest, create, createHttpRequest, loadScript, loadModules, decodeUrl,
         source_dir, settings, internals, browser, findFunction, toJSON,
         isArrayProto, isRootCollection, isBatchMode, isNodeJs, isObject, isFunc, isStr, getPromise, _ensureJSROOT,
         clTList, clTMap, clTObjString, clTKey, clTFile, clTText, clTLatex, clTColor, clTStyle,
         getKindForType, getTypeForKind, kInspect, isPromise } from '../core.mjs';
import { select as d3_select } from '../d3.mjs';
import { openFile, kBaseClass, clTStreamerInfoList, clTDirectory, clTDirectoryFile, nameStreamerInfo, addUserStreamer } from '../io.mjs';
import { getRGBfromTColor } from '../base/colors.mjs';
import { prJSON, BasePainter, getElementRect, _loadJSDOM, getTDatime, convertDate } from '../base/BasePainter.mjs';
import { getElementMainPainter, getElementCanvPainter, cleanup, ObjectPainter } from '../base/ObjectPainter.mjs';
import { createMenu } from './menu.mjs';
import { getDrawSettings, getDrawHandle, canDrawHandle, addDrawFunc, draw, redraw } from '../draw.mjs';
import { BatchDisplay, GridDisplay, TabsDisplay, FlexibleDisplay, BrowserLayout, getHPainter, setHPainter } from './display.mjs';
import { showProgress, ToolbarIcons, registerForResize, injectStyle, saveFile } from './utils.mjs';


const kTopFolder = 'TopFolder', kExpand = 'expand', kPM = 'plusminus', kDfltDrawOpt = '__default_draw_option__',
      cssValueNum = 'h_value_num', cssButton = 'h_button', cssItem = 'h_item', cssTree = 'h_tree';

function injectHStyle(node) {
   function img(name, sz, fmt, code) {
      return `.jsroot .img_${name} { display: inline-block; height: ${sz}px; width: ${sz}px; background-image: url("data:image/${fmt};base64,${code}"); }`;
   }

   const bkgr_color = settings.DarkMode ? 'black' : '#E6E6FA',
         border_color = settings.DarkMode ? 'green' : 'black',
         shadow_color = settings.DarkMode ? '#555' : '#aaa';

   injectStyle(`
.jsroot .${cssTree} { display: block; white-space: nowrap; }
.jsroot .${cssTree} * { padding: 0; margin: 0; font-family: Verdana, Geneva, Arial, Helvetica, sans-serif; box-sizing: content-box; line-height: 14px }
.jsroot .${cssTree} img { border: 0px; vertical-align: middle; }
.jsroot .${cssTree} a { text-decoration: none; vertical-align: top; white-space: nowrap; padding: 1px 2px 0px 2px; display: inline-block; margin: 0; }
.jsroot .${cssTree} p { font-weight: bold; white-space: nowrap; text-decoration: none; vertical-align: top; white-space: nowrap; padding: 1px 2px 0px 2px; display: inline-block; margin: 0; }
.jsroot .h_value_str { color: green; }
.jsroot .${cssValueNum} { color: blue; }
.jsroot .h_line { height: 18px; display: block; }
.jsroot .${cssButton} { cursor: pointer; color: blue; text-decoration: underline; }
.jsroot .${cssItem} { cursor: pointer; user-select: none; }
.jsroot .${cssItem}:hover { text-decoration: underline; }
.jsroot .h_childs { overflow: hidden; display: block; }
.jsroot_fastcmd_btn { height: 32px; width: 32px; display: inline-block; margin: 2px; padding: 2px; background-position: left 2px top 2px;
                      background-repeat: no-repeat; background-size: 24px 24px; border-color: inherit; }
.jsroot_inspector { border: 1px solid ${border_color}; box-shadow: 1px 1px 2px 2px ${shadow_color}; opacity: 0.95; background-color: ${bkgr_color}; }
.jsroot_drag_area { background-color: #007fff; }
${img('minus', 18, 'gif', 'R0lGODlhEgASAJEDAIKCgoCAgAAAAP///yH5BAEAAAMALAAAAAASABIAAAInnD+By+2rnpyhWvsizE0zf4CIIpRlgiqaiDosa7zZdU22A9y6u98FADs=')}
${img('minusbottom', 18, 'gif', 'R0lGODlhEgASAJECAICAgAAAAP///wAAACH5BAEAAAIALAAAAAASABIAAAImlC+Ay+2rnpygWvsizE0zf4CIEpRlgiqaiDosa7zZdU32jed6XgAAOw==')}
${img('plus', 18, 'gif', 'R0lGODlhEgASAJECAICAgAAAAP///wAAACH5BAEAAAIALAAAAAASABIAAAIqlC+Ay+2rnpygWvsizCcczWieAW7BeSaqookfZ4yqU5LZdU06vfe8rysAADs=')}
${img('plusbottom', 18, 'gif', 'R0lGODlhEgASAJECAICAgAAAAP///wAAACH5BAEAAAIALAAAAAASABIAAAIplC+Ay+2rnpygWvsizCcczWieAW7BeSaqookfZ4yqU5LZdU36zvd+XwAAOw==')}
${img('empty', 18, 'gif', 'R0lGODlhEgASAJEAAAAAAP///4CAgP///yH5BAEAAAMALAAAAAASABIAAAIPnI+py+0Po5y02ouz3pwXADs=')}
${img('line', 18, 'gif', 'R0lGODlhEgASAIABAICAgP///yH5BAEAAAEALAAAAAASABIAAAIZjB+Ay+2rnpwo0uss3kfz7X1XKE5k+ZxoAQA7')}
${img('join', 18, 'gif', 'R0lGODlhEgASAIABAICAgP///yH5BAEAAAEALAAAAAASABIAAAIcjB+Ay+2rnpwo0uss3kf5BGocNJZiSZ2opK5BAQA7')}
${img('joinbottom', 18, 'gif', 'R0lGODlhEgASAIABAICAgP///yH5BAEAAAEALAAAAAASABIAAAIZjB+Ay+2rnpwo0uss3kf5BGrcSJbmiaZGAQA7')}
${img('base', 18, 'gif', 'R0lGODlhEwASAPcAAPv6/Pn4+mnN/4zf/764x2vO//Dv84HZ/5jl/0ZGmfTz9vLy8lHB/+zr70u+/7S03IODtd7d6c/P0ndqiq/w/4Pb/5SKo/Py9fPy9tTU121kjd/f4MzM062tx5+zy5rO67GwxNDM14d8mJzn/7awwry713zX/9bW27u71lFRmW5uoZ+fxjOy/zm1/9HQ2o3g/2xfgZeMplav7sn9/6Cgv37X/6Dp/3jU/2uJ2M7J1JC63vn5+v38/d7e38PD0Z7o/9LR4LS01cPDzPb1+Nzb5IJ2lHCEv5bk/53C3MrJ3X56t+np6YF7o3JsndTU5Wtgh5GHoKaesuLi4mrO/19RdnnV/4WBqF5QdWPK/4+PvW5uu4+PuuHh4q7w/97e68C9z63w/9PT0+zs7FtbmWVXerS0yaqitpuSqWVlpcL6/8jD0H/C9mVajqWu3nFwpYqHtFfE/42DnaWl0bTz/5OPt+7u7tra5Y+Yz+Tk56fM6Gek5pG50LGpvOHh72LJ/9XU5lbD/6GnwHpujfDu8mxpntzb45qav7PH41+n6JeXyUZGopyYsWeGyDu2/6LQ44re/1yV41TD/8LC1zix/sS/zdTU4Y+gsd/c5L7z+a6uzE+3+XG89L6+087O1sTD3K2twoGBtWVbgomo4P///wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH5BAEAAKMALAAAAAATABIAAAjtAEcJFLgDTyE7SVCsAAJgoMNRYTII8fEpkAckOpiEaPhwlARLexxhmpEGzJEmBAJ0HMXhw6MfXeZQsDHADZ8hK13kMTEAwQgEL2oYiaJgJZFDU24cqHCgSgFGFgysBJAJkB8BBQRggQNJxKCVo0rIcMAgEgMHmnBMaADWEyIWLRptEqWETRG2K//ombSmjRZFoaCo4djRyZ0HchIlSECIRNGVXur0WcAlCJoUoOhcAltpyQIxPSRtGQPhjRkMKyN0krLhBCcaKrJoOCO1I48vi0CU6WDIyhNBKcEGyBEDBpUrZOJQugC2ufPnDwMCADs=')}
${img('folder', 18, 'gif', 'R0lGODlhEgASANUAAPv7++/v79u3UsyZNOTk5MHBwaNxC8KPKre3t55sBrqHIpxqBMmWMb2KJbOBG5lnAdu3cbWCHaBuCMuYM///urB+GMWSLad1D8eUL6ampqVzDbeEH6t5E8iVMMCNKMbGxq58FppoAqh2EKx6FP/Ub//4k+vr6///nP/bdf/kf//viba2tv//////mQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH5BAEAAC4ALAAAAAASABIAAAaRQJdwSCwaj8ik0jUYTBidAEA5YFkplANhehxABGAwpKHYRByVwHBibbvbo8+Q0TrZ7/jWBTHEtP6AgX8GK0MWLSWJiostEoVCBy0qk5SVLQmPLh4tKZ2eny0LmQ0tKKanqC0hmQotJK+wsS0PfEIBZxUgHCIaBhIJCw8ZBUMABAUrycrLBQREAAEm0tPUUktKQQA7')}
${img('folderopen', 18, 'gif', 'R0lGODlhEgASANUAAO/v76VzDfv7+8yZNMHBweTk5JpoAqBuCMuYM8mWMZ5sBpxqBPr7/Le3t///pcaaGvDker2KJc+iJqd1D7B+GOKzQ8KPKqJwCrOBG7WCHbeEH9e4QNq/bP/rhJlnAffwiaampuLBUMmgIf3VcKRyDP/XhLqHIqNxC8iVMMbGxqx6FP/kf//bdf/vievr67a2tv/4k8aaGf//nP//mf///wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH5BAEAADUALAAAAAASABIAAAaVwJpwSCwaj8ikUjgYIBIogEA5oFkZDEtheqzKvl9axKTJYCiAIYIGblutqtQwQYPZ73jZpCGM+f+AfiEdJy99M21tMxwxJQeGNTGIeHcyHzEjCpAAki2en54OIhULkAKSMiuqqysOGxIGkDWcMyy2t7YQDx58QqcBwMAkFwcKCwYgBEQFBC/Oz9AEBUUALtbX2FJLSUEAOw==')}
${img('page', 18, 'gif', 'R0lGODlhEgASAOYAAPv7++/v7/j7/+32/8HBweTk5P39/djr/8Df//7///P5/8Ph//T09fn5+YGVw2t0pc7n/15hkFWn7ZOq0nqDsMDA/9nh7YSbyoqo2eTx/5G46pK873N+sPX6//f395Cjy83m/7rd/9jl9m13qGVqmoeh0n+OvI+z5Yyu387T//b6/2dtnvz9/32JtpS/8sbGxv7+/tvn92lwom96rHJ8rnSAsoep3NHp/8nk/7e3t+vr67a2tun1/3V4o+Hw/9vt/////wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH5BAEAAEEALAAAAAASABIAAAejgEGCg4SFhoeILjaLjDY1AQCHG0AGAA0eDBY1E5CGGjBAoQkCMTUSHwGGJwaiAh0iNbEvhiihAgIDPDwpFRw5hhgsuLk8Pz8HNL+FJSoKuT4+xzczyoQXzjzQxjcgI9WDDrraPzc4OA/fgibZ0eTmCzLpQS0Z7TflCwgr8hT2EOYIQpCQ16OgwYMRCBgqQGCHw4cOCRQwBCCAjosYL3ZCxNFQIAA7')}
${img('question', 18, 'gif', 'R0lGODlhEgASAPelAOP0//7//9bs//n///j//9Ls/8Pn//r//6rB1t3f5crO2N7g5k1livT4+7PW9dXt/+v4/+Xl5LHW9Ov6/+j1/6CyxrfCz9rd5Nzj6un1/Z6ouwcvj8HBzO7+/+3//+Ln7BUuXNHv/6K4y+/9/wEBZvX08snn/19qhufs8fP7/87n/+/t7czr/5q1yk55q97v/3Cfztnu//z//+X6/ypIdMHY7rPc/7fX9cbl/9/h52WHr2yKrd/0/9fw/4KTs9rm75Svzb2+ya690pu92mWJrcT3//H//+Dv/Xym35S216Ouwsvt/3N/mMnZ5gEBcMnq/wEBXs/o/wEBetzw/zdYpTdZpsvP2ClGml2N3b3H0Nzu/2Z2lF1ricrl/93w/97h6JqluktojM/u/+/z9g8pVff4+ebu9q+1xa6/zzdFaIiXr5Wyz0xslrTK4uL//2uIp11rh8Xj/NXn+Oz2/9bf6bG2xAEBePP//1xwkK/K5Nbr/8fp/2OBtG53kai3ykVCYwEBde/6/7O4xabI+fD//+by/x8+jDhZpM/q/6jK58nO19ny/7jV7ZO42NHr/9H4/2ZwimSV6VBxwMDX7Nvf5hYwX5m20sfb6Ieqyk9Yjr/k/cPM2NDp/+/098Tl9yQ9jLfW+Mne8sjU30JklP///wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH5BAEAAKUALAAAAAASABIAAAjxAEsJHEiwoMEyGMaQWthg0xeDAlGUWKjoz5mFAegY/LBiIalMUK54JCWEoJkIpA6kSDmoAykKgRaqGSiq04A5A5r4AKOEAAAtE2S0USAwSwYIhUb8METiUwAvemLMCMVEoIUjAF5MIYXAThUCDzgVWDQJjkA0cngIEHAHCCAqRqJ0QeQoDxeBFS71KKDCwxonhwiZwPEkzo4+AimJqBFCjBs+UjZ4WmLgxhAQVgb6acGIBShJkbAgMSAhCQ1IBTW8sZRI055HDhoRqXQCYo4tDMJgsqGDTJo6EAlyYFNkVJDgBgXBcJEAucEFeC44n04wIAA7')}
${img('histo1d', 16, 'gif', 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAMAAAAoLQ9TAAADAFBMVEW9vb2np6empqanpqenpqivr6//AAD3+fn09vb19vf3+Pv8+v//+//29/v3+fr19vbZ3Nza3d7X0+Lb3t7b3N3AwMP2+PimpqXe4+Th6uvQ0dTi6uzg5ebFx8nt6vb////r5/T2+fnl4e3a3uDN0NT7/P6lpqX3+vvn9vhcVVHu+//W1uH48//29P///f+mpqelpqb4/v/t/f9oY2H6///59v/x8fXw9fny9/78/v+lpqf7//9iXl12dHPW2t/R1tdtaGbT2dpoZmT6/v9ycnKCgoJpZGJ6dnT3///2///0//95entpa2t+gIKLjI55d3aDgYBvcXL1+/z9/v6lpaWGiIt7fH6Ji42SlJeEhIZubGyMjI17fYD+//+kpKSmpaaRk5WIioyRk5aYmp2OkJJ+f4KTlZilpKWcnqGVl5qcnqCfoaOYmp6PkZOdn6GsrrGoqq6qrK+rrbGpq66lp6uqrbCoqq20tLSsrKzc3NzMzMzPz88AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB6enrU4/9iYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmLU4/9KSkoAAAAAAAAAAAB6enrU4//m5uZiYmLm5uZiYmLm5uZiYmLm5uZiYmLm5ubU4/9KSkoAAAAAAAAAAAB6enrU4/9KSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkrU4/9KSkoAAAAAAAAAAABubm7U4//U4//U4//U4//U4//U4//U4//U4//U4//U4//U4/9KSkoAAAAAAAAAAABubm5KSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkpKSkoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABt6dBwBYjWHVG2AAAAB3RSTlP///////8AGksDRgAAAAlwSFlzAAALEgAACxIB0t1+/AAAAOxJREFUeNpjYGBkggBmFmYmRlY2BkZ2DhDg5OLm4eblY2RjYOIXEBQSFhEFkgKCYkxsDOKcEpJS0jKycvJS8gpcIAFFJWUVGFIFCqipa8hrymtpy+sI6crr6bMxGBgayRvLm8iamkmZW1gCBayslWxs7ewd7OwdlZStrYC2ODm7uLrJu3t4usl7mRiwMeh7+/j6+VsHBMr7+wQFhwAFQsPCIyKjomOiIsOiYuPYGOITEpOSU1LTElNTElPlgQLpGZlZ2Tm5eZm5OZm5IAGm/ILCouKS0rKS4oISeaDDypniEICpgo2hsgoZVLMBAHIaNxuoIXy2AAAAAElFTkSuQmCC')}
${img('histo2d', 16, 'gif', 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAIAAACQkWg2AAAACXBIWXMAAAsSAAALEgHS3X78AAABUUlEQVR42o1R0U7CQBDkU/w/v8qk1/OhCS+88miMiQYMBMNRTqiisQiRhF6h13adsuVKDEYvm81kdmdv9q7V7XallP65I30UrpErLGW73SaiFtDF5dXWmNNITJrubJ4RWUI2qU33GTorAdSJMeMwhOxpEE20noRTYISaajBcMrsdOlkgME+/vILtPw6j+BPg5vZuFRuUgZGX71tc2AjALuYrpWcP/WE1+ADAADMAY/OyFghfpJnlSTCAvLb1YDbJmArC5izwQa0K4g5EdgSbTQKTX8keOC8bgXSWAEbqmbs5BmPF3iyR8I+vdNrhIj3ewzdnlaBeWroCDHBZxWtm9DzaEyU2L8pSCNEI+N76+fVs8rE8fbeRUiWR53kHgWgs6cXbD2OOIScQnji7g7OE2UVZNILflnbrulx/XKfTAfL+OugJgqAShGF4/7/T6/Ug+AYZrx7y3UV8agAAAABJRU5ErkJggg==')}
${img('histo3d', 16, 'gif', 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAMAAAAoLQ9TAAADAFBMVEX////48OjIgTrHfjjKgTr78+yixH9HiQBHiACiw37jvJXfpVP6wzT7zTn7yj3lp1qOhyJzvgCa3wCa3gB2ugBinQ6Pt2D4+vfOjEr96p3986z83mT99rD99a3WhEvC0kaU3gCV3ADG71zo/KORzw1gowBonS3Z5snHfTb6uyD6tzD+/Nb7z0/70D3KdTXI1l3h+qTi+KXD7luU3ACY3gCc4QCi3g1QjwXHfjr710T6xi/+9sn70UH73E/MdDqhvQCi1BKkug2XxACU1wCS2ADD51rr9aJXkw/MpYDgpkb71U7+9MP7007hnEO3niOj0hGq3SCZtQCbtQCjtwj//+7F4Vui0wBDhgDk5eTMxcGxfi3TfTq+fyPPz4ak3xux5TG87kmZuwCZvACWtgDf8a+c0gCy3yNLiwD7/Ps1iwCiyAPF3F7j7bG67EW77kmq5yWYzwCZwwCTugDc8KTE51ve9YZCigCgwgCVuQDa5p7U9YSq4yWT2gCV2wCT2wCp2h/y+9HC6lW87DlChQBGigCixgCYvgDK3nyXvgC72UjG7mSj3xXL7XDK7W7b9J+36TrG9lBDhQBHigClywCbxQDJ33SXvwCYvQCcwADq+8S77Ei460Hd+KDD9VHU/2VEhgBdlR1rowCXwwDK4W6bxgCaxQCVvQDp/L+/8k7F91fn/6zC9V18tiNbkx/U1dSyv6RglihnoQCYwwChyQDs/7/P/2fE92F5tCBdkib19vXW1taoupVLiwNooQCWwADo/7h5tSBFhgaouZXx8vHOz86ftYVJiQBNjQKetIXt7u3Nzs0AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABBfAAAAAAAAAA2tmA2tmAAACQAAAAAAAAAAAAAAAAAAAAAATgAABNBfMAAAAAAAAA2tpQ2tpQAACQAAAAAAAAAAAAAAAAAAAAAAdQAABNBfMAAAAAAAAA2tsg2tsgAACQAAAAAAAAAAAAAAAAAAAAAAggAABNBfMCaVmCSAAAAAXRSTlMAQObYZgAAAAlwSFlzAAALEgAACxIB0t1+/AAAAQVJREFUeNpjYGBkYmZhZWBj5+BkAAMubh5ePn4BQSFhEVExcaCAhKSUtIysnLyCopKyiqqaOoOGppa2jq6evoGhkbGJqZk5g4WllbWNrZ29g6OTs4urmzuDh6eXt4+vn39AYFBwSGhYOENEZFR0TGxcfEJiUnJKalo6A0NGZlZ2Tm5efkFhUXFJqTnQnrLyisqq6prauvqGxqZmoEBLa1t7R2dXd09vX/+EiUCBSZOnTJ02fcbMWbPnzJ03HyiwYOGixUuWLlu+YuWq1WvWAgXWrd+wcdPmTVu2btu+Y/06kHd27tq9Z+++/QcOHtq1E+JBhsNHjh47fuLIYQYEOHnq1EkwAwCuO1brXBOTOwAAAABJRU5ErkJggg==')}
${img('graph', 16, 'png', 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH4AEFCgohaz8VogAAAT9JREFUOMulkz1LQlEYx39XmrIhcLa5i4mD4JBQrtHieDbb+gx3dbl9hca7tLi4VOsRMkKQVO7LLAQNNdSQgyJPg903tDT8w4HzPDznd56Xc1BKCVsokzTGjhPBXDcQAAEZDgPZCHDQaESH5/PYXyqZxp8A349vGHkjOXo3uXtp035sy79KABi8DQCwshb7x3U6gIYU6KNej+1kEwUEjbQeWtIb9mTsOCIgN1eXgiYd96OdcKNBOoCuQc47pFgoGmHw7skZTK9X16CUku5zV9BIkhz4vgSuG/nsWzvKIhmXAah+VpfJsxnGZMKkUln05NwykqOORq6UWkn+TRokXFEG/Vx/45c3fbrnFKjpRVkZgHKxbAC8NptrAfm9PAD2l42VtdJjDDwv2CSLpSaGMgsFc91hpdRFKtNtf6OxLeAbVYSb7ipFh3AAAAAASUVORK5CYII=')}
${img('mgraph', 16, 'gif', 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAMAAAAoLQ9TAAADAFBMVEW9vb2np6empqanpqenpqivr68AAAD3+fn09vb19vf3+Pv8+v//+//29/v3+fr19vbZ3Nza3d6/wcLb3t7b3N3AwMPi4et2oz0yfwDh3+n2+PimpqXe4+Th6uvD0NHi6uzg5ebFx8nt6vY2ggDs/881gQDr5/T2+fnFz9DDZVrAIhDEZVvJ0tTN0NTX0+IvZAA4hAAuYgDT0N77/P6lpqX3+vvn9vi/JRL81cHBJhTu+//W1uEkXgD48//29P8fWwD//f+mpqelpqb4/v/t/f+yCwDBKBi3CgD6//8kYAD59v/x8fXQ0dTw9fny9/78/v+lpqf7//+wAADV5ezZ5e7g6PQjZQDf4+/W2t/R1tfT2drT3+OvAAD9///6/v/////k4vIiXwC1AAD3///2///X6Oz0//9+rUgzfwAwdADa6u6xCwDAJxb5///1+/z9/v6lpaUwfADo/8vl4e3a3uDb6eu+IxL808C+IhDZ5+nW2tr+//+kpKSmpaaArUgvewB1oj39/v/e5ebVd227HgvJa2H8///6/PylpKXn4+ze4eLg5+j9/v20tLSsrKzc3NzMzMzPz88AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAPAAAAAAEAAAEAAABzL1z/CSMAAAAAAAAAAAAAAAMAAAAmCTsAAAAAAAAAAAAAAAAAAAQAAQEAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA7op0gAAAAB3RSTlP///////8AGksDRgAAAAlwSFlzAAALEgAACxIB0t1+/AAAAOhJREFUeNpjYGBkggBmFmYmRlY2BkZ2DhDg5OLm4eblY2RjYOIXEBQSFhEVE5cQl5RiYmOQ5pSRlZNXUFRSVlFV4wIJqGtoamnr6OrpGxgaGQMFTEzNzC0sraxtbPXs7B0c2RicnF1c3dw9PL28fXz9/IECAYFBwSGhYeERkVHRMYEBQFti4+ITEuOTklNSg9I8nNgYHOPTMzLjA7Oyc7Jz8/ILQAKFRRnFJaVl5RWVVdU1bAy18XX1DfGNTc0trW3t8UCBjvj4+M746q74+O7qHpAAUzwyADqsl6kGAZj62Bj6JyCDiWwAyPNF46u5fYIAAAAASUVORK5CYII=')}
${img('tree', 16, 'gif', 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAABIAAAASABGyWs+AAAACXZwQWcAAAAQAAAAEABcxq3DAAACjklEQVQ4y4WTy49LcRzFP+2tzmVUr9dIDJOWGGVBicgEyTQTCzIetUFssDKJSFhY2SARCYvBbGrj8QcIkYglk8xCmEQ9xqNexbQVY2Zub3un9/W7PwstHZH4Jie/7+Kc8/suzgnwr+kjBqSBbm2lkm6bHyH3XM9SZQ8Z8s3UQJPo0IJVof5EZ7v2faxMrKONlhmQWN5GSFEwLbhybjBPhDwVsmQ4AaA09Mou+k8d702EAzXiS6KEgzahoIthGOi6DtKlN71GS+/cEPs0WewaX2R9ZphssP776UhESY0WSpQNg7Jh4Anx+zgJVKpV3uZyvHjzir27NwGs/XVBH8c7N2nnjx7eSqlYxPM8JCCkxBU+rhA4dVhCYJgmyc4Ej96/7rLi8nNAPc/k2ZNp7cnTpziuiy8lvpSI+tvYhS/xpY8vJXMiEbZv3MzFq3cJqaqiPX72jnKt9kfQRPZ9f5qZ70sMawyAas1GseIy1rNtVXK8Mkm1VsP2PBzhYQuB5Qns+t6AJQSqqlIcrTAy+ONGENBWLF3MN71MxXGo1mE6DqbrYLou8z/a7L3uMKvgUnU8xk2T3u71ADGFDdgvCx/3TwkLEfKxhWDHbY+eYZ+Obz6tJcmRApRsuJ8Ex4Po7Jl8/TDBl7flm4Gm5F1vSZKaFQUh4cB9OLgaDB3UVrjwA+6tBnKAis4El8lwujmJSVQeoKAxFzqDcG0KWhZC6R30tUJRQD3Odxqy4G+DDFks4pisY5RLgRx5pZ5T4cKy95yhSrxZDBCaVqIMOpAd2EIeSEW7wLQh3Ar7RtCHbk0v0vQy1WdgCymgf147Sa0dhAOVMZgoALDu2BDZ/xloQAzQgIOhMCnPYQ+gHRvi4d/8n00kYDRVLifLAAAAJXRFWHRkYXRlOmNyZWF0ZQAyMDEwLTAyLTExVDE0OjUxOjE3LTA2OjAwHh/NoQAAACV0RVh0ZGF0ZTptb2RpZnkAMjAwNC0wOS0yMFQxNzoxMDoyNi0wNTowMCcJijsAAAAASUVORK5CYII=')}
${img('branch', 16, 'gif', 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAMAAAAoLQ9TAAADAFBMVEX///99plFAfADL27hpmyfP8YxyoilSiRiv0XGGygK02VtRiBmVwjh8xQCcziFZkhLz9+9BfQB2rwaCyACRygFQigXw9Ox0mkpXkQCJzwBblgBmkzP8/fxEgQBCfwBEgQejwITe3t5hkC1CfgBfjynZ2tmSq3eArDu72oNvoDJajyTY2dhFgQDCzLqhvn9EgAazx55XkwCVzC2824GMs1J0oUTY48xajiK72YR9qj2Tq3dhkix+th99xAB3uADA3oQ+fABEgABIgwW82oOUyi5VkgCf0CaEygB+wwCbzjN1mkrA3YZ1tAB7wAB+uB1vl0JdmgCJwwCKzwBoqAB4nVBikiuayzZ8wQCFywCg0Sjd3t1lkjFBfABLgwhKgwlmpgCK0QCJxQBclwDMzMzPz89GggCDpFxDfgCIpmPl5eUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABhAABQEABuZQBjYQBvcgAIZABiYQBlZAAABQDU/wCx/wCO/wBr/wBI/wAl/wAA/wAA3AAAuQAAlgAAcwAAUADU/wCx/wCO/wBr/wBI/wAl/wAA/gAA3AAAuQAAlgAAcwAAUADj/wDH/wCr/wCP/wBz/wBX/wBV/wBJ3AA9uQAxlgAlcwAZUADw/wDi/wDU/wDG/wC4/wCq/wCq/wCS3AB6uQBilgBKcwAyUAD//wD//wD//wD//wD//wD//wD+/gDc3AC5uQCWlgBzcwBQUAD/8AD/4gD/1AD/xgD/uAD/qgD/qgDckgC5egCWYgBzSgBQMgD/4wD/xwD/qwD/jwD/cwD/VwD/VQDcSQC5PQCWMQBzJQBQGQD/1AD/sQD/jgD/awD/SAD/JQD+AADcAAC5AACWAABzAABQAAD/1AD/sQD/jgD/awD/SAD/JQD/AADcAACwULzWAAAAAXRSTlMAQObYZgAAAAlwSFlzAAALEgAACxIB0t1+/AAAALZJREFUeNpjYAADRiZGBmTAzMLKxowswM7BycWNLMDEw8vHL4AkICgkLCIqhiQgLiEpJS0D5cjKySsoKimrqMJk1dQ1NLW0dXQZ9PTlZEECBoZGxiamOmbmmhaWViABaxtbO3sHRycTZxdXA7ANbu4enkxeDt4+vn7WIAH/gMCg4JBQprDwiEhBkEBUtGBMrI5OXHxCYpI/2BrV5OSU5NS09BjB6CiE01JTM5KTVZHcmpycCWEAANfrHJleKislAAAAAElFTkSuQmCC')}
${img('leaf', 16, 'gif', 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAMAAAAoLQ9TAAADAFBMVEX////M27mQs2tilDA9eQA7egBbkhVTjAxJgwWBqVdGgQBrnySdxViu0WrE4oaYv2PC35NtoCqxvaSevX5FgAB7qje73nDK6neu109vpyVupCGo2kJ9xwBQhBtilC9pnx7G63PM6olgnAB/vQBDigCVv0yb1CaDzAB8uBJwmkNnnBnB52ui2Ca94WZopAE/hgCtz2ue2CmDywCByACKujtdjyqdvHpdlhLV9YdkowCFxwCw1lFXmAJvpC5jng1coABlpwBprAB8sitAfABDfgKx31Gr3TuCsi5sqABtqgBUkxTV85zL7I213mef0j+OxyKk00k/ewCp3TCSyhCw0mRRjQC23HmU0h55wQB5vQB4uQB1tgCIwBeJxgCBvQDC3ndCjACYx1204Fx6wwB7vQB1tABzsQBBfQBpkzdtpQB9tQA/iQCMu1SMukNUlQBYmQBsqAd4rh11rwZyrQBvqgBDfwCqvZVWkQBUnACp0Hq/43K733C+4X+w12eZyT2IvSN5sgpZkwBxmUSDqFlbnACJzQy742p/wwB2ugBysgBwrwBvqwBwqQBhmgBCfwDV2NN8pk1foACO1QBZmABRkABpqwB3uQB0sgB0rgBnogBUjgC7w7NymkFdnQBUhxmis41okjdCfgBGgQWHpWPMzMzb3NtumD5NhQzT09Pv8O/a2trOz87l5eXc3NzPz88AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABtHAA4HXQAAEgAAB9CTigAAABCfCQ4HTxy6Kw4HXRy+8xy+8wAAMwAAAAAAAAAAAAAAAAAAAAAAAgAAAgAABgYAAG7AAAAACgAAAgAAAgYAAEAAAAAAMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA4Hnw4HnwAAFRpRiYmO2V0aWRtSSY7ZWdsZVNpdGNBO251amRGO3R0bCYmO3J3ZWlvVCY7c2xuaVc7d28ABCwBG8q3AAAAAXRSTlMAQObYZgAAAAlwSFlzAAALEgAACxIB0t1+/AAAAOtJREFUeNpjYIACRiZmFlY2dg4ol5OLm4eXj19AUAjMFRYRFROXkJSSlpEF8+XkFRSVlFVU1dQ1NMF8LW0dXT19A0MjYxNTIN/M3MLSytrG1s7ewdHJGSjg4urm7uHp5e3j6+cfABIIDAoOCVUJC4+IjIqOAQk4x8bFJyQmJadEpaalpQMFMjKzsnNy8/ILCouKS0qBAmXlFZVV1TW1dfUNJY1NQIHmlta29o7ozq7unt6+fgaGCRMnTZ4ydVrU9BkzZ5XOBiqYM3HuvPkL0tPTFy5avATkzqXLlq9YuWoJEKxeA/Ho2nUMyAAA9OtDOfv2TiUAAAAASUVORK5CYII=')}
${img('leaf_method', 16, 'png', 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQBAMAAADt3eJSAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAAKlBMVEUAAAAAgADzExMAgIAAAADAwMCAgADxGRnuFxLnHhHuIyPKJQ/rLi7////aW8ZOAAAAAXRSTlMAQObYZgAAAAFiS0dEDfa0YfUAAAAHdElNRQfgCxIPFR/msbP7AAAAaUlEQVQI12NggANBBiYFMMNQxAjCYA4UUoZIBRpBGMyiQorGIIaxWRCEwSYo3igiCNJlaLkwGSwkJn1QGMhgNDQ0TDU2dACqERYTDksGG5SkmGoApBnFhBRTBUAiaYJpDIJgs10cGBgdACxbDamu76Z5AAAAJXRFWHRkYXRlOmNyZWF0ZQAyMDE3LTAxLTE3VDA5OjMwOjM1KzAxOjAwyGHxKQAAACV0RVh0ZGF0ZTptb2RpZnkAMjAxNi0xMS0xOFQxNToyMTozMSswMTowMJgvuUkAAAAASUVORK5CYII=')}
${img('globe', 18, 'gif', 'R0lGODlhEwASAPcAAPr7/AFyAQFCpwGD6jy3/wE9on7N0AE+pAFjyMLI0AE2mwF94wGP9QFpzgU3nISSopWgrmJsfTNLfgFHqAFuBilNiTp4sLnGzwWb/0xYb/P09mRygGl0hRlnMgR12V2Pr6e4xF9peS2Cyh5FpBdSfgF84YmisdPa30hjvw+foQFYvlWj4HWIlkWb5gk5n/b4+gw+kgFMscXb6ylmieDj5ju2pylTsniElgqd/u/x8wGW/O7v8SVMsUq+JSSJXQFiwfv+/AFqvB9ntobZeKbc/9vt+B+YmW2rvKruzQGPkm3PPrjmxQFIklrFLVbD4QGMYaXkoIPD13LC+nGw5AGFQHG66gF2eBaJxket9sLf84HI+wF7axBdbg2c0CR+1QFsEIfJ7yqoUIbH41tldgF+KzVTjn3QfitZgTJZkaDR8gKDsXeWrE+zogE3nCeKzQFtJ0tknjdnbQGB6EJgxQFqAcLJ0WC//yKm/wE+o7vI0ARozEOz/4/g/4KToyaX4/D09pCpuNHV24HA6gw7oAF/AXWKnEVSb5TI6VzDTrPprxBQts7e6FNdcBA9oySd9RRjPAhnD2NvgIydrF+6wdLo9v7//2K+twKSdDmKyeD56wGCyHq12VnF+ZXXsARdTjZWthShoo7gtilDlAFw1RCXvF+z6p/R8kqZzAF0Oj5jjFuJqgFoAkRgxtzr9YmcrJKsugFlylfBgxJGhjJIeFnFuhmi/+bo65ipt8Hn+UhVco7B5SZowAGBKoaZqAGGAVHBUwF8Qq7Y819qe4DEoVyYwrnb8QGN9GCy6QFTuHB9jgGY/gFRtuTu9ZOhr150iwFbwTFiwFus4h9mYt/y+kWZ35vM7hGfccz43Xy/6m3BuS1GiYveqDRfwnbUV4rdu////wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH5BAEAAN8ALAAAAAATABIAAAj/AL8JHEiwVTVspar8ITiwiJhswyaBibJJUq9Trxh+S2OAVihvSzqRcoTpmy5ADIPFqrHtGpBETbrIuXJEBgiGbHoogTItExJOoAbw8rHmAkFTC8KYwTWkGx8COp4AozAjD8Epo4wQQfTLCQEcxqigoiONBUFqerRYspYCgzIGmgi98cRlA8EVLaR4UJPk0oASVgKs6kAiBMFDdrzAarDFF5kgCJA9ilNBGMFjWAQse/YjwBcVMfCcgTMr2UBKe0QIaHNgAiQmBRS4+CSKEYSBWe44E6JoEAxZDhrxmDPCEAcaA4vVinTCwi5uKFhBs6EtQ4QEOQYy8+NGUDRiqdCUJJGQa8yNQDsADHyxSNUHE4Vc3erzoFkdWxoAVNLIv7///98EBAA7')}
${img('canvas', 16, 'gif', 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAMAAAAoLQ9TAAADAFBMVEX/AAC1t7etsLCsrq6rrq6rrq2tr6+0tratsK/////p6enIysrl5OTn5uXo5+ajpaXo5+dhhKdliKlmialgg6elp6f6+/vIycnr7Ozw7u7x7u7x7u3t6+vLzMvp7vbs7/bz8PD17+3z7u2rrq/6xS76xy13zv9+z/+EwLF4zP/38/NfgqWAoL36uCj6vCmR2f+TxamSrBmNvoj++fz8+Pf69/WZ3f+g4P+n4/+Cnw2Dox16nQ3//f9hg6eBob6x5/+46f+77P+p2NKSZhOi1s////7//fusrq98sB6CsyWDtSmFuC9+dBl/tilfgqasr6+sr7DbAADcAABcgqWAoLyusLC4urqssLCssLGrsLCrr7Ctr67c3NzMzMwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABoAAAKAgJldmV0dU8GB3JvTnZDBWVyb2xsYwdjYWxhUBB0bmVrY2F1b3IICGRPYmFyZWQAAAXj1P/Hsf+rjv+Pa/9zSP9XJf9VAP9JANw9ALkxAJYlAHMZAFDU1P+xsf+Ojv9ra/9ISP8lJf8AAP4AANwAALkAAJYAAHMAAFDU4/+xx/+Oq/9rj/9Ic/8lV/8AVf8ASdwAPbkAMZYAJXMAGVDU8P+x4v+O1P9rxv9IuP8lqv8Aqv8AktwAerkAYpYASnMAMlDU//+x//+O//9r//9I//8l//8A/v4A3NwAubkAlpYAc3MAUFDU//Cx/+KO/9Rr/8ZI/7gl/6oA/6oA3JIAuXoAlmIAc0oAUDLU/+Ox/8eO/6tr/49I/3Ml/1cA/1UA3EkAuT0AljEAcyUAUBnU/9Sx/7GO/45r/2tI/0gl/yUA/gAA3AAAuQAAlgAAcwAAUADj/9TH/7Gr/46P/2tz/0hX/yVV/wBJ3AAQ+AFLAAAAAXRSTlMAQObYZgAAAAlwSFlzAAALEgAACxIB0t1+/AAAALpJREFUeNpjYGBkYmZhYWFlYWNngAAOTijg4oYIMHPy8PLx8nDycwpwQwUEhYSFRDhFxTi5xCECEpJS0jKcsqL8nGwgARZOOXkFRSWwMcwgAWVOFVU1dQ1NLW0dmICunr6BoZGxiSlEgJnTzNzC0sraxtYOJmDv4Ojk7MLp6gYRcOf08PTy9vHl9IOa4c+JAGCBAM7AoEDOwEDO4BCIABOSilCQQBhTeERkVGS4f3R0aBhIICYWAWIYGAClIBsa7hXG7gAAAABJRU5ErkJggg==')}
${img('profile', 16, 'gif', 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAIAAACQkWg2AAAACXBIWXMAAAsSAAALEgHS3X78AAABZElEQVR42o1R22rCQBD1U/p//apCNtsHwRdfBaFIKbRoUVKMMTWBWIxVCq2b+07POrn4UKjDMpw9O2fm7G5vNBpJKe2/Qto4uEc2WMrBYEBEPaAky36UulwnlSRpUeZEBSGrpEiyHJVGAPVJqZvbO3ftv83Dle+vvPV4/LD0PGYAcKrSFJUsEOgHKoj3s9dFGH9uou3k8ekQKxyDQcYpBnYC7Hm9zBZmlL8BiIJDC0AWpa4FwhZJXoDCBgYAjgU5ToBt+k1tL14ssFNNvIEBAFwVljJlSDBfpwyg1ISnYoEsiHju5XLcd+T50q0tEQm7eaWKKNfUWgKApUsbPFY0lzY6DraEZm585Do/CLMzqLQWQnSC9k34lVa7PTsBs/zYOa4LB5ZlnQXCbif40Ra50jUwE6JtCcMlUiMQlugEQYisG8CWtGlRdQL+jmui/rjhcAhk/Reo6ff7RuB53vN1MZ1OIfgFQC1cuR3Y6lIAAAAASUVORK5CYII=')}
${img('execute', 16, 'png', 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQAQMAAAAlPW0iAAAABlBMVEXAwMAAxwCvbOAvAAAAAXRSTlMAQObYZgAAAAlwSFlzAAALEgAACxIB0t1+/AAAACBJREFUCFtjYIABHgYGfiA6wMD/gYH/B5g8ABLhYUAGAHniBNrUPuoHAAAAAElFTkSuQmCC')}
${img('file', 16, 'png', 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQEAYAAABPYyMiAAAABmJLR0T///////8JWPfcAAAACXBIWXMAAABIAAAASABGyWs+AAAACXZwQWcAAAAQAAAAEABcxq3DAAAA2klEQVRIx61VURbDIAgTX+9ljg4n2z5sNouj1ml+LE9rQkSU5PA6kTZBToTznj5aqKqq+py4lFJKScnMzCwlAAB6IbnNuyXycd1g3oHrf32CmR9mZqpVOdDHs2DmI+c+AiJixu1RAN9xFUcdWCjVIr8xCX8Jubc8Ao9CJF8nRFgNJBxZSCEkjmrIxxSS0yIAoBU4OkpfU8sCPEbEvqaOXcR31zWORbYJ8EI8rsK+DWm7gMVb8F/GK7eg6818jNjJZjMn0agY7x6oxqL5sWbIbhLHoQN78PQ5F3kDgX8u9tphBfoAAAAldEVYdGRhdGU6Y3JlYXRlADIwMTUtMDItMDZUMTA6Mjc6MzErMDE6MDChLu/mAAAAJXRFWHRkYXRlOm1vZGlmeQAyMDE0LTExLTEyVDA4OjM5OjIwKzAxOjAwIGvf8wAAAABJRU5ErkJggg==')}
${img('text', 16, 'gif', 'R0lGODlhEgASALMAAP/////MzP+Zmf9mZv8zM/8AAMzM/8zMzJmZ/5mZmWZm/2ZmZjMz/zMzMwAA/////yH5BAUUAA8ALAAAAAASABIAAARo8MlJq73SKGSwdSDjUQoIjhNYOujDnGAnFXRBZKoBIpMw1ICHaaigBAq/AUK1CVEIhcfPNFlRbAEBEvWr0VDYQLYgkCQWh8XiAfgRymPyoTFRa2uPO009maP8ZmsjAHxnBygLDQ1zihEAOw==')}
${img('task', 18, 'png', 'iVBORw0KGgoAAAANSUhEUgAAABUAAAAVCAAAAACMfPpKAAAABGdBTUEAALGPC/xhBQAAAAFzUkdCAK7OHOkAAAAgY0hSTQAAeiYAAICEAAD6AAAAgOgAAHUwAADqYAAAOpgAABdwnLpRPAAAAAJiS0dEAP+Hj8y/AAAACXBIWXMAAABIAAAASABGyWs+AAAATklEQVQY05XQUQoAIAgD0N3JY3fIChWttKR9xYvBCj0J0FsI3VVKQflwV22J0oyo3LOCc6pHW4dqi56v2CebbpMLtcmr+uTizz6UYpBnADSS8gvhaL5WAAAAJXRFWHRkYXRlOmNyZWF0ZQAyMDE2LTA0LTA3VDA5OjQyOjQ4KzAyOjAwMgzRmQAAACV0RVh0ZGF0ZTptb2RpZnkAMjAxNC0xMS0xMlQwODozOToxOCswMTowMJ0LlncAAAAASUVORK5CYII=')}
${img('pavetext', 18, 'png', 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAAAAAA6mKC9AAAABGdBTUEAALGPC/xhBQAAAAFzUkdCAK7OHOkAAAAgY0hSTQAAeiYAAICEAAD6AAAAgOgAAHUwAADqYAAAOpgAABdwnLpRPAAAAAJ0Uk5TAAB2k804AAAAAmJLR0QA/4ePzL8AAAAJcEhZcwAAAEgAAABIAEbJaz4AAAAsSURBVBjTY2CgCuBAAt1gASS5KKgARBpJACSEooIsARRbkABYoDsKCRDhEQBA2Am/6OrPewAAACV0RVh0ZGF0ZTpjcmVhdGUAMjAxNi0wMS0wNFQxMDoxODoyNyswMTowMHsz6UQAAAAldEVYdGRhdGU6bW9kaWZ5ADIwMTQtMTEtMTJUMDg6Mzk6MjArMDE6MDAga9/zAAAAAElFTkSuQmCC')}
${img('pavelabel', 18, 'png', 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAAAAAA6mKC9AAAABGdBTUEAALGPC/xhBQAAAAFzUkdCAK7OHOkAAAAgY0hSTQAAeiYAAICEAAD6AAAAgOgAAHUwAADqYAAAOpgAABdwnLpRPAAAAAJ0Uk5TAAB2k804AAAAAmJLR0QA/4ePzL8AAAAJcEhZcwAAAEgAAABIAEbJaz4AAAApSURBVBjTY2CgCuBAAt1gASS5KJgABzUEgABFANUWJAAWYIhCAkR4BAAHoAkEyi2U3wAAACV0RVh0ZGF0ZTpjcmVhdGUAMjAxNi0wMS0wNFQxMDoxODoyNyswMTowMHsz6UQAAAAldEVYdGRhdGU6bW9kaWZ5ADIwMTQtMTEtMTJUMDg6Mzk6MjArMDE6MDAga9/zAAAAAElFTkSuQmCC')}
${img('list', 16, 'png', 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH4AEECTc01vBgywAAAE9JREFUOMu1k8ERwDAMwqRc9l/Z/eeRpKZlABkOLFD0JQGgAAah5kp8Y30F2HEwDhGTCG6tX5yqtAV/acEdwHQHl0Y8RbA7pLIxRPziGyM9xLEOKSpp/5AAAAAASUVORK5CYII=')}
${img('color', 16, 'png', 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAMAAAAoLQ9TAAAAM1BMVEUAAAAA4xcavGZGS1xZT79lW+9wdvFz/3N6fo3RISTZwXbyniXz80v/AAD/zAD/66v//6vGWiYeAAAAAXRSTlMAQObYZgAAAAFiS0dEAIgFHUgAAAAJcEhZcwAADswAAA7MAbGhBn4AAAAHdElNRQfgAQQLLBhOmhPcAAAAIklEQVQY02NgRgEMDAzMnLzcfDwC7IxMbKwsQ10A3XMEAQA3JQVNowlkTAAAAABJRU5ErkJggg==')}
${img('colz', 16, 'png', 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQBAMAAADt3eJSAAAAMFBMVEV6fo0A4xcavGZGS1xZT79lW+9wdvFz/3PRISTZwXbyniXz80v/AAD/zAD/66v//6t1AkcGAAAAAXRSTlMAQObYZgAAAAFiS0dEAIgFHUgAAAAJcEhZcwAADswAAA7MAbGhBn4AAAAHdElNRQfgAQQLNwdqpNWzAAAAT0lEQVQI12NgYGAwNjZmAAOLjmY0hs2ZwxCG1arFEIbt3csQhvXuzRCG/f/PEIZ5eTGEYSgoDGEYKSlDGGZpyRCGaWgwhGHi4gxhwG0HAwCr3BFWzqCkcAAAAABJRU5ErkJggg==')}
${img('frame', 16, 'png', 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAQAAAC1+jfqAAAAAmJLR0QA/4ePzL8AAAAJcEhZcwAACxMAAAsTAQCanBgAAAAHdElNRQfgAQQLOwq4oOYCAAAAcUlEQVQoz7WQMQqAMAxFX0Uk4OLgIbp4oZ7BA/cOXR0KDnGpRbGayT+EQF74nw+GHIBo+5hdWdqAaFDoLIsegCSeWE0VcMxXYM6xvmiZSYDTooSR4WlxzzBZwGYBuwWs4mWUpVHJe1H9F1J7yC4ov+kAkTYXFCNzDrEAAAAASUVORK5CYII=')}
${img('class', 16, 'png', 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABmJLR0QAvQC9AL1pQtWoAAAAjUlEQVR42p2T2wnAIAxFM0g/O6jDdBBHcAyHKKQYjfiI0UY4P8I9BG4CID8smB4+8SUsohpO3CFzKqmBFrhCO4kqQnCR6MJF4BEJTVQFhBAmASNIZkH6a0OMc8oUDAu8z7RhTTBVyIIEhxeCdYWjQApvK2TBrgGpwpP1livsBXC0ROMO/LqDKjKEzaf8AZWbJP6pTT9BAAAATHpUWHRTb2Z0d2FyZQAAeNpz0FDW9MxNTE/1TUzPTM5WMNEz0jNQsLTUNzDWNzBUSC7KLC6pdMitLC7JTNZLLdZLKS3IzyvRS87PBQDzvxJ8u4pLSgAAADN6VFh0U2lnbmF0dXJlAAB42ktKs0hLMkk2MzJKNEuzMLKwtEizSElMMbNITUw0NUtNAQCc7Qma0Goe1QAAAABJRU5ErkJggg==')}
${img('member', 16, 'png', 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABmJLR0QAvQC9AL1pQtWoAAAAX0lEQVR42mNgAAIVBob/+DADPgBS8GCPBV6M1xCKDcDnBRcoZhgW4D8DBV75v2bLATAmxyC4ZmRMrCFYNfeU9BBvwJwpS8AYWTNZBoAwTDPFBpAciDCDyNFMtXSAFwAAUyq0GRPbbz4AAABMelRYdFNvZnR3YXJlAAB42nPQUNb0zE1MT/VNTM9MzlYw0TPSM1CwtNQ3MNY3MFRILsosLql0yK0sLslM1kst1kspLcjPK9FLzs8FAPO/Eny7iktKAAAAM3pUWHRTaWduYXR1cmUAAHjaS01JNrE0S00zSbU0NEsxMbMwM0xOSjYwNzY3NLRIMjUCAJcdCJ2BHe6SAAAAAElFTkSuQmCC')}
${img('tf1', 16, 'png', 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQAgMAAABinRfyAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAADFBMVEX/////AP8/SMz///+Cf5VqAAAAAXRSTlMAQObYZgAAAAFiS0dEAIgFHUgAAAAJcEhZcwAADsQAAA7EAZUrDhsAAAAHdElNRQfgCw4QHgSCla+2AAAAL0lEQVQI12MQYAACrAQXiFBoABINCgwMQgwcDAwSDEwMDKmhodMYJjAwaKDrAAEAoRAEjHDJ/uQAAAAldEVYdGRhdGU6Y3JlYXRlADIwMTYtMTEtMTRUMTc6Mjk6MjErMDE6MDDxcSccAAAAJXRFWHRkYXRlOm1vZGlmeQAyMDE2LTExLTE0VDE3OjI5OjA1KzAxOjAwNka8zgAAAABJRU5ErkJggg==')}
${img('tf2', 16, 'png', 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQAgMAAABinRfyAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAADFBMVEX/////AP8A/wD////pL6WoAAAAAXRSTlMAQObYZgAAAAFiS0dEAIgFHUgAAAAJcEhZcwAADsQAAA7EAZUrDhsAAAAHdElNRQfgCw4PNgzGaW1jAAAARUlEQVQI12NgEGDQZAASKkBigQKQ6GhgYBDiYgASIiAigIGBS8iBgUFhEpCnoAEkUkNDQxkagUIMrUDMMAVETAARQI0MAD5GCJ7tAr1aAAAAJXRFWHRkYXRlOmNyZWF0ZQAyMDE2LTExLTE0VDE2OjUxOjUzKzAxOjAwi1Gz3gAAACV0RVh0ZGF0ZTptb2RpZnkAMjAxNi0xMS0xNFQxNjo1MTozNiswMTowMG5bLUIAAAAASUVORK5CYII=')}
`, node, 'jsroot_hstyle');
}

/** @summary Return size as string with suffix like MB or KB
  * @private */
function getSizeStr(sz) {
   if (sz < 10000)
      return sz.toFixed(0) + 'B';
   if (sz < 1e6)
      return (sz/1e3).toFixed(2) + 'KiB';
   if (sz < 1e9)
      return (sz/1e6).toFixed(2) + 'MiB';
   return (sz/1e9).toFixed(2) + 'GiB';
}

/** @summary Return ROOT version as string
  * @private */
function getVersionStr(v) {
   const major = Math.floor(v / 10000);
   let minor = Math.floor((v - major*10000)/100).toString(),
       patch = (v % 100).toString();
   if (minor.length < 2)
      minor = '0' + minor;
   if (patch.length < 2)
      patch = '0' + patch;
   return `${major}.${minor}.${patch}`;
}

/** @summary draw list content
  * @desc used to draw all items from TList or TObjArray inserted into the TCanvas list of primitives
  * @private */
async function drawList(dom, lst, opt) {
   if (!lst || !lst.arr)
      return null;

   const handle = {
      dom, lst, opt,
      indx: -1, painter: null,
      draw_next() {
         while (++this.indx < this.lst.arr.length) {
            const item = this.lst.arr[this.indx],
                  opt2 = (this.lst.opt && this.lst.opt[this.indx]) ? this.lst.opt[this.indx] : this.opt;
            if (!item)
               continue;
            return draw(this.dom, item, opt2).then(p => {
               if (p && !this.painter) this.painter = p;
               return this.draw_next(); // reenter loop
            });
         }
         return this.painter;
      }
   };

   return handle.draw_next();
}

// ===================== hierarchy scanning functions ==================================

/** @summary Create hierarchy elements for TFolder object
  * @private */
function folderHierarchy(item, obj) {
   if (!obj?.fFolders)
      return false;

   if (!obj.fFolders.arr.length) {
      item._more = false;
      return true;
   }

   item._childs = [];

   for (let i = 0; i < obj.fFolders.arr.length; ++i) {
      const chld = obj.fFolders.arr[i];
      item._childs.push({
         _name: chld.fName,
         _kind: getKindForType(chld._typename),
         _obj: chld
      });
   }
   return true;
}

/** @summary Create hierarchy elements for TList object
  * @private */
function listHierarchy(folder, lst) {
   if (!isRootCollection(lst))
      return false;

   if (!lst.arr?.length) {
      folder._more = false;
      return true;
   }

   let do_context = false, prnt = folder;
   while (prnt) {
      if (prnt._do_context)
         do_context = true;
      prnt = prnt._parent;
   }

   // if list has objects with similar names, create cycle number for them
   const ismap = (lst._typename === clTMap), names = [], cnt = [], cycle = [];

   for (let i = 0; i < lst.arr.length; ++i) {
      const obj = ismap ? lst.arr[i].first : lst.arr[i];
      if (!obj) continue; // for such objects index will be used as name
      const objname = obj.fName || obj.name;
      if (!objname) continue;
      const indx = names.indexOf(objname);
      if (indx >= 0)
         cnt[indx]++;
       else {
         cnt[names.length] = cycle[names.length] = 1;
         names.push(objname);
      }
   }

   folder._childs = [];
   for (let i = 0; i < lst.arr.length; ++i) {
      const obj = ismap ? lst.arr[i].first : lst.arr[i];
      let item;
      if (!obj?._typename) {
         item = {
            _name: i.toString(),
            _kind: getKindForType('NULL'),
            _title: 'NULL',
            _value: 'null',
            _obj: null
          };
      } else {
         item = {
            _name: obj.fName || obj.name,
            _kind: getKindForType(obj._typename),
            _title: `${obj.fTitle || ''} type:${obj._typename}`,
            _obj: obj
         };

         switch (obj._typename) {
            case clTColor: item._value = getRGBfromTColor(obj); break;
            case clTText:
            case clTLatex: item._value = obj.fTitle; break;
            case clTObjString: item._value = obj.fString; break;
            default: if (lst.opt && lst.opt[i] && lst.opt[i].length) item._value = lst.opt[i];
         }

         if (do_context && canDrawHandle(obj._typename)) item._direct_context = true;

         // if name is integer value, it should match array index
         if (!item._name || (Number.isInteger(parseInt(item._name)) && (parseInt(item._name) !== i)) || (lst.arr.indexOf(obj) < i))
            item._name = i.toString();
         else {
            // if there are several such names, add cycle number to the item name
            const indx = names.indexOf(obj.fName);
            if ((indx >= 0) && (cnt[indx] > 1)) {
               item._cycle = cycle[indx]++;
               item._keyname = item._name;
               item._name = item._keyname + ';' + item._cycle;
            }
         }
      }

      folder._childs.push(item);
   }
   return true;
}

/** @summary Create hierarchy of TKey lists in file or sub-directory
  * @private */
function keysHierarchy(folder, keys, file, dirname) {
   if (keys === undefined) return false;

   folder._childs = [];

   for (let i = 0; i < keys.length; ++i) {
      const key = keys[i];

      if (settings.OnlyLastCycle && (i > 0) && (key.fName === keys[i-1].fName) && (key.fCycle < keys[i-1].fCycle)) continue;

      const item = {
         _name: key.fName + ';' + key.fCycle,
         _cycle: key.fCycle,
         _kind: getKindForType(key.fClassName),
         _title: key.fTitle + ` (size: ${getSizeStr(key.fObjlen)})`,
         _keyname: key.fName,
         _readobj: null,
         _parent: folder
      };

      if (key.fRealName)
         item._realname = key.fRealName + ';' + key.fCycle;

      if (key.fClassName === clTDirectory || key.fClassName === clTDirectoryFile) {
         const dir = (dirname && file) ? file.getDir(dirname + key.fName) : null;
         if (dir) {
            // remove cycle number - we have already directory
            item._name = key.fName;
            keysHierarchy(item, dir.fKeys, file, dirname + key.fName + '/');
         } else {
            item._more = true;
            item._expand = function(node, obj) {
               // one can get expand call from child objects - ignore them
               return keysHierarchy(node, obj.fKeys);
            };
         }
      } else if ((key.fClassName === clTList) && (key.fName === nameStreamerInfo)) {
         if (settings.SkipStreamerInfos) continue;
         item._name = nameStreamerInfo;
         item._kind = getKindForType(clTStreamerInfoList);
         item._title = 'List of streamer infos for binary I/O';
         item._readobj = file.fStreamerInfos;
      }

      folder._childs.push(item);
   }

   return true;
}

/** @summary Create hierarchy for arbitrary object
  * @private */
function objectHierarchy(top, obj, args = undefined) {
   if (!top || (obj === null))
      return false;

   top._childs = [];

   let proto = Object.prototype.toString.apply(obj);

   if (proto === '[object DataView]') {
      let item = {
          _parent: top,
          _name: 'size',
          _value: obj.byteLength.toString(),
          _vclass: cssValueNum
      };

      top._childs.push(item);
      const namelen = (obj.byteLength < 10) ? 1 : Math.log10(obj.byteLength);

      for (let k = 0; k < obj.byteLength; ++k) {
         if (k % 16 === 0) {
            item = {
              _parent: top,
              _name: k.toString(),
              _value: '',
              _vclass: cssValueNum
            };
            while (item._name.length < namelen)
               item._name = '0' + item._name;
            top._childs.push(item);
         }

         let val = obj.getUint8(k).toString(16);
         while (val.length < 2) val = '0'+val;
         if (item._value)
            item._value += (k % 4 === 0) ? ' | ' : ' ';

         item._value += val;
      }
      return true;
   }

   // check _nosimple property in all parents
   let nosimple = true, do_context = false, prnt = top;
   while (prnt) {
      if (prnt._do_context)
         do_context = true;
      if ('_nosimple' in prnt) {
         nosimple = prnt._nosimple;
         break;
      }
      prnt = prnt._parent;
   }

   const isarray = (isArrayProto(proto) > 0) && obj.length,
         compress = isarray && (obj.length > settings.HierarchyLimit);
   let arrcompress = false;

   if (isarray && (top._name === 'Object') && !top._parent) top._name = 'Array';

   if (compress) {
      arrcompress = true;
      for (let k = 0; k < obj.length; ++k) {
         const typ = typeof obj[k];
         if ((typ === 'number') || (typ === 'boolean') || ((typ === 'string') && (obj[k].length < 16))) continue;
         arrcompress = false; break;
      }
   }

   if (!('_obj' in top))
      top._obj = obj;
   else if (top._obj !== obj)
      alert('object missmatch');

   if (!top._title) {
      if (obj._typename)
         top._title = getKindForType(obj._typename);
      else if (isarray)
         top._title = 'Array len: ' + obj.length;
   }

   if (arrcompress) {
      for (let k = 0; k < obj.length;) {
         let nextk = Math.min(k+10, obj.length), allsame = true, prevk = k;

         while (allsame) {
            allsame = true;
            for (let d=prevk; d<nextk; ++d)
               if (obj[k]!==obj[d]) allsame = false;

            if (allsame) {
               if (nextk===obj.length) break;
               prevk = nextk;
               nextk = Math.min(nextk+10, obj.length);
            } else if (prevk !== k) {
               // last block with similar
               nextk = prevk;
               allsame = true;
               break;
            }
         }

         const item = { _parent: top, _name: k+'..'+(nextk-1), _vclass: cssValueNum };

         if (allsame)
            item._value = obj[k].toString();
          else {
            item._value = '';
            for (let d = k; d < nextk; ++d)
               item._value += ((d===k) ? '[ ' : ', ') + obj[d].toString();
            item._value += ' ]';
         }

         top._childs.push(item);

         k = nextk;
      }
      return true;
   }

   let lastitem, lastkey, lastfield, cnt;

   for (const key in obj) {
      if ((key === '_typename') || (key[0] === '$')) continue;
      const fld = obj[key];
      if (isFunc(fld)) continue;
      if (args?.exclude && (args.exclude.indexOf(key) >= 0)) continue;

      if (compress && lastitem) {
         if (lastfield===fld) { ++cnt; lastkey = key; continue; }
         if (cnt > 0) lastitem._name += '..' + lastkey;
      }

      const item = { _parent: top, _name: key };

      if (compress) { lastitem = item; lastkey = key; lastfield = fld; cnt = 0; }

      if (fld === null) {
         item._value = item._title = 'null';
         if (!nosimple) top._childs.push(item);
         continue;
      }

      let simple = false;

      if (isObject(fld)) {
         proto = Object.prototype.toString.apply(fld);

         if (isArrayProto(proto) > 0) {
            item._title = 'array len=' + fld.length;
            simple = (proto !== '[object Array]');
            if (!fld.length) {
               item._value = '[ ]';
               item._more = false; // hpainter will not try to expand again
            } else {
               item._value = '[...]';
               item._more = true;
               item._expand = objectHierarchy;
               item._obj = fld;
            }
         } else if (proto === '[object DataView]') {
            item._title = 'DataView len=' + fld.byteLength;
            item._value = '[...]';
            item._more = true;
            item._expand = objectHierarchy;
            item._obj = fld;
         } else if (proto === '[object Date]') {
            item._more = false;
            item._title = 'Date';
            item._value = fld.toString();
            item._vclass = cssValueNum;
         } else {
            if (fld.$kind || fld._typename)
               item._kind = item._title = getKindForType(fld.$kind || fld._typename);

            if (fld._typename) {
               item._title = fld._typename;
               if (do_context && canDrawHandle(fld._typename)) item._direct_context = true;
            }

            // check if object already shown in hierarchy (circular dependency)
            let curr = top, inparent = false;
            while (curr && !inparent) {
               inparent = (curr._obj === fld);
               curr = curr._parent;
            }

            if (inparent) {
               item._value = '{ prnt }';
               item._vclass = cssValueNum;
               item._more = false;
               simple = true;
            } else {
               item._obj = fld;
               item._more = false;

               switch (fld._typename) {
                  case clTColor: item._value = getRGBfromTColor(fld); break;
                  case clTText:
                  case clTLatex: item._value = fld.fTitle; break;
                  case clTObjString: item._value = fld.fString; break;
                  default:
                     if (isRootCollection(fld) && isObject(fld.arr)) {
                        item._value = fld.arr.length ? '[...]' : '[]';
                        item._title += ', size:' + fld.arr.length;
                        if (fld.arr.length) item._more = true;
                     } else {
                        item._more = true;
                        item._value = '{ }';
                     }
               }
            }
         }
      } else if ((typeof fld === 'number') || (typeof fld === 'boolean') || (typeof fld === 'bigint')) {
         simple = true;
         if (key === 'fBits')
            item._value = '0x' + fld.toString(16);
         else
            item._value = fld.toString();
         item._vclass = cssValueNum;
      } else if (isStr(fld)) {
         simple = true;
         item._value = '&quot;' + fld.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;') + '&quot;';
         item._vclass = 'h_value_str';
      } else if (typeof fld === 'undefined') {
         simple = true;
         item._value = 'undefined';
         item._vclass = cssValueNum;
      } else {
         simple = true;
         alert(`miss ${key} type ${typeof fld}`);
      }

      if (!simple || !nosimple)
         top._childs.push(item);
   }

   if (compress && lastitem && (cnt > 0))
      lastitem._name += '..' + lastkey;

   return true;
}

/** @summary Create hierarchy elements for TTask object
  * @desc function can be used for different derived classes
  * we show not only child tasks, but all complex data members
  * @private */
function taskHierarchy(item, obj) {
   if (!obj?.fTasks)
      return false;

   objectHierarchy(item, obj, { exclude: ['fTasks', 'fName'] });

   if (!obj.fTasks.arr.length && !item._childs.length) {
      item._more = false;
      return true;
   }

   for (let i = 0; i < obj.fTasks.arr.length; ++i) {
      const chld = obj.fTasks.arr[i];
      item._childs.push({
         _name: chld.fName,
         _kind: getKindForType(chld._typename),
         _obj: chld
      });
   }

   return true;
}

/** @summary Create hierarchy for streamer info object
  * @private */
function createStreamerInfoContent(lst) {
   const h = { _name: nameStreamerInfo, _childs: [] };

   for (let i = 0; i < lst.arr.length; ++i) {
      const entry = lst.arr[i];

      if (entry._typename === clTList)
         continue;

      if (typeof entry.fName === 'undefined') {
         console.warn(`strange element in StreamerInfo with type ${entry._typename}`);
         continue;
      }

      const item = {
         _name: `${entry.fName};${entry.fClassVersion}`,
         _kind: `class ${entry.fName}`,
         _title: `class:${entry.fName} version:${entry.fClassVersion} checksum:${entry.fCheckSum}`,
         _icon: 'img_class',
         _childs: []
      };

      if (entry.fTitle)
         item._title += '  ' + entry.fTitle;

      h._childs.push(item);

      if (typeof entry.fElements === 'undefined')
         continue;
      for (let l = 0; l < entry.fElements.arr.length; ++l) {
         const elem = entry.fElements.arr[l];
         if (!elem?.fName) continue;
         let _name = `${elem.fTypeName} ${elem.fName}`;
         const _title = `${elem.fTypeName} type:${elem.fType}`;
         if (elem.fArrayDim === 1)
            _name += `[${elem.fArrayLength}]`;
         else {
            for (let dim = 0; dim < elem.fArrayDim; ++dim)
               _name += `[${elem.fMaxIndex[dim]}]`;
         }
         if (elem.fBaseVersion === 4294967295)
            _name += ':-1';
         else if (elem.fBaseVersion !== undefined)
            _name += `:${elem.fBaseVersion}`;
         _name += ';';
         if (elem.fTitle)
            _name += ` // ${elem.fTitle}`;

         item._childs.push({ _name, _title, _kind: elem.fTypeName, _icon: (elem.fTypeName === kBaseClass) ? 'img_class' : 'img_member' });
      }
      if (!item._childs.length)
         delete item._childs;
   }

   return h;
}

/** @summary tag item in hierarchy painter as streamer info
  * @desc this function used on THttpServer to mark streamer infos list
  * as fictional TStreamerInfoList class, which has special draw function
  * @private */
function markAsStreamerInfo(h, item, obj) {
   if (obj?._typename === clTList)
      obj._typename = clTStreamerInfoList;
}


/** @summary Create hierarchy for object inspector
  * @private */
function createInspectorContent(obj) {
   const h = { _name: 'Object', _title: '', _click_action: kExpand, _nosimple: false, _do_context: true };

   if (isStr(obj.fName) && obj.fName)
      h._name = obj.fName;

   if (isStr(obj.fTitle) && obj.fTitle)
      h._title = obj.fTitle;

   if (obj._typename)
      h._title += `  type:${obj._typename}`;

   if (isRootCollection(obj)) {
      h._name = obj.name || obj._typename;
      listHierarchy(h, obj);
   } else
      objectHierarchy(h, obj);

   return h;
}


/** @summary Parse string value as array.
  * @desc It could be just simple string:  'value' or
  * array with or without string quotes:  [element], ['elem1',elem2]
  * @private */
function parseAsArray(val) {
   const res = [];

   if (!isStr(val)) return res;

   val = val.trim();
   if (!val) return res;

   // return as array with single element
   if ((val.length < 2) || (val.at(0) !== '[') || (val.at(-1) !== ']')) {
      res.push(val);
      return res;
   }

   // try to split ourself, checking quotes and brackets
   let nbr = 0, nquotes = 0, ndouble = 0, last = 1;

   for (let indx = 1; indx < val.length; ++indx) {
      if (nquotes > 0) {
         if (val[indx] === '\'') nquotes--;
         continue;
      }
      if (ndouble > 0) {
         if (val[indx] === '"') ndouble--;
         continue;
      }
      switch (val[indx]) {
         case '\'': nquotes++; break;
         case '"': ndouble++; break;
         case '[': nbr++; break;
         case ']': if (indx < val.length - 1) { nbr--; break; }
         // eslint-disable-next-line  no-fallthrough
         case ',':
            if (nbr === 0) {
               let sub = val.substring(last, indx).trim();
               if ((sub.length > 1) && (sub.at(0) === sub.at(-1)) && ((sub[0] === '"') || (sub[0] === '\'')))
                  sub = sub.slice(1, sub.length - 1);
               res.push(sub);
               last = indx+1;
            }
            break;
      }
   }

   if (!res.length)
      res.push(val.slice(1, val.length - 1).trim());

   return res;
}


/** @summary central function for expand of all online items
  * @private */
function onlineHierarchy(node, obj) {
   if (node && obj?._childs) {
      for (let n = 0; n < obj._childs.length; ++n) {
         if (obj._childs[n]._more || obj._childs[n]._childs)
            obj._childs[n]._expand = onlineHierarchy;
      }

      node._childs = obj._childs;
      obj._childs = null;
      return true;
   }

   return false;
}

/** @summary Check if draw handle for specified object can do expand
  * @private */
function canExpandHandle(handle) {
   return handle?.expand || handle?.get_expand || handle?.expand_item;
}

const kindTFile = getKindForType(clTFile);

/**
  * @summary Painter of hierarchical structures
  *
  * @example
  * import { HierarchyPainter } from 'https://root.cern/js/latest/modules/gui/HierarchyPainter.mjs';
  * // create hierarchy painter in 'myTreeDiv'
  * let h = new HierarchyPainter('example', 'myTreeDiv');
  * // configure 'simple' layout in 'myMainDiv'
  * // one also can specify 'grid2x2' or 'flex' or 'tabs'
  * h.setDisplay('simple', 'myMainDiv');
  * // open file and display element
  * h.openRootFile('https://root.cern/js/files/hsimple.root').then(() => h.display('hpxpy;1','colz')); */

class HierarchyPainter extends BasePainter {

   #monitoring_interval; // monitoring time interval
   #monitoring_on; // if monitoring enabled
   #monitoring_handle; // timer handle for monitoring
   #monitoring_frame; // animation frame for monitoring
   #one_by_one;  // process drop items one by one
   #topname; // top item name
   #cached_draw_object; // cached object for first draw

   /** @summary Create painter
     * @param {string} name - symbolic name
     * @param {string} frameid - element id where hierarchy is drawn
     * @param {string} [backgr] - background color */
   constructor(name, frameid, backgr) {
      super(frameid);
      this.name = name;
      this.h = null; // hierarchy
      this.with_icons = true;

      if (backgr === '__as_dark_mode__')
         this.setBasicColors();
      else
         this.background = backgr;
      this.files_monitoring = !frameid; // by default files monitored when nobrowser option specified
      this.nobrowser = (frameid === null);

      // remember only very first instance
      if (!getHPainter())
         setHPainter(this);
   }

   /** @summary Set basic colors
     * @private */
   setBasicColors() {
      this.background = settings.DarkMode ? 'black' : 'white';
      this.textcolor = settings.DarkMode ? '#eee' : '#111';
   }

   /** @summary Cleanup hierarchy painter
     * @desc clear drawing and browser */
   cleanup() {
      this.clearHierarchy(true);

      super.cleanup();

      if (getHPainter() === this)
         setHPainter(null);
   }

   /** @summary Create file hierarchy
     * @private */
   fileHierarchy(file, folder) {
      const painter = this;
      if (!folder) folder = {};

      folder._name = file.fFileName;
      folder._title = (file.fTitle ? file.fTitle + ', path: ' : '') + file.fFullURL + `, size: ${getSizeStr(file.fEND)}, version: ${getVersionStr(file.fVersion)}, modified: ${convertDate(getTDatime(file.fDatimeM))}`;
      folder._kind = kindTFile;
      folder._file = file;
      folder._fullurl = file.fFullURL;
      folder._localfile = file.fLocalFile;
      folder._had_direct_read = false;
      // this is central get method, item or itemname can be used, returns promise
      folder._get = function(item, itemname) {
         if (item?._readobj)
            return Promise.resolve(item._readobj);

         if (item)
            itemname = painter.itemFullName(item, this);

         const readFileObject = file2 => {
            if (!this._file)
               this._file = file2;

            if (!file2)
               return Promise.resolve(null);

            return file2.readObject(itemname).then(obj => {
               // if object was read even when item did not exist try to reconstruct new hierarchy
               if (!item && obj) {
                  // first try to found last read directory
                  const d = painter.findItem({ name: itemname, top: this, last_exists: true, check_keys: true });
                  if ((d?.last !== undefined) && (d.last !== this)) {
                     // reconstruct only sub-directory hierarchy
                     const dir = file2.getDir(painter.itemFullName(d.last, this));
                     if (dir) {
                        d.last._name = d.last._keyname;
                        const dirname = painter.itemFullName(d.last, this);
                        keysHierarchy(d.last, dir.fKeys, file2, dirname + '/');
                     }
                  } else {
                     // reconstruct full file hierarchy
                     keysHierarchy(this, file2.fKeys, file2, '');
                  }
                  item = painter.findItem({ name: itemname, top: this });
               }

               if (item) {
                  item._readobj = obj;
                  // remove cycle number for objects supporting expand
                  if ('_expand' in item) item._name = item._keyname;
               }

               return obj;
            });
         };

         if (this._file) return readFileObject(this._file);
         if (this._localfile) return openFile(this._localfile).then(f => readFileObject(f));
         if (this._fullurl) return openFile(this._fullurl).then(f => readFileObject(f));
         return Promise.resolve(null);
      };

      keysHierarchy(folder, file.fKeys, file, '');

      return folder;
   }

   /** @summary Iterate over all items in hierarchy
     * @param {function} func - function called for every item
     * @param {object} [top] - top item to start from
     * @private */
   forEachItem(func, top) {
      function each_item(item, prnt) {
         if (!item) return;
         if (prnt) item._parent = prnt;
         func(item);
         if ('_childs' in item) {
            for (let n = 0; n < item._childs.length; ++n)
               each_item(item._childs[n], item);
         }
      }

      if (isFunc(func))
         each_item(top || this.h);
   }

   /** @summary Search item in the hierarchy
     * @param {object|string} arg - item name or object with arguments
     * @param {string} arg.name -  item to search
     * @param {boolean} [arg.force] - specified elements will be created when not exists
     * @param {boolean} [arg.last_exists] -  when specified last parent element will be returned
     * @param {boolean} [arg.check_keys] - check TFile keys with cycle suffix
     * @param {boolean} [arg.allow_index] - let use sub-item indexes instead of name
     * @param {object} [arg.top] - element to start search from
     * @private */
   findItem(arg) {
      function find_in_hierarchy(top, fullname) {
         if (!fullname || !top) return top;

         let pos = fullname.length;

         if (!top._parent && (top._kind !== kTopFolder) && (fullname.indexOf(top._name) === 0)) {
            // it is allowed to provide item name, which includes top-parent like file.root/folder/item
            // but one could skip top-item name, if there are no other items
            if (fullname === top._name) return top;

            const len = top._name.length;
            if (fullname[len] === '/') {
               fullname = fullname.slice(len+1);
               pos = fullname.length;
            }
         }

         function process_child(child, ignore_prnt) {
            // set parent pointer when searching child
            if (!ignore_prnt)
               child._parent = top;

            if ((pos >= fullname.length - 1) || (pos < 0))
               return child;

            return find_in_hierarchy(child, fullname.slice(pos + 1));
         }

         while (pos > 0) {
            // we try to find element with slashes inside - start from full name
            let localname = (pos >= fullname.length) ? fullname : fullname.slice(0, pos);

            if (top._childs) {
               // first try to find direct matched item
               for (let i = 0; i < top._childs.length; ++i) {
                  if (top._childs[i]._name === localname)
                     return process_child(top._childs[i]);
               }

               // if first child online, check its elements
               if ((top._kind === kTopFolder) && (top._childs[0]._online !== undefined)) {
                  for (let i = 0; i < top._childs[0]._childs.length; ++i) {
                     if (top._childs[0]._childs[i]._name === localname)
                        return process_child(top._childs[0]._childs[i], true);
                  }
               }

               // if allowed, try to found item with key
               if (arg.check_keys) {
                  let newest = null;
                  for (let i = 0; i < top._childs.length; ++i) {
                    if (top._childs[i]._keyname === localname) {
                       if (!newest || (newest._cycle < top._childs[i]._cycle))
                          newest = top._childs[i];
                    }
                  }
                  if (newest) return process_child(newest);
               }

               let allow_index = arg.allow_index;
               if ((localname.at(0) === '[') && (localname.at(-1) === ']') &&
                    /^\d+$/.test(localname.slice(1, localname.length - 1))) {
                  allow_index = true;
                  localname = localname.slice(1, localname.length - 1);
               }

               // when search for the elements it could be allowed to check index
               if (allow_index && /^\d+$/.test(localname)) {
                  const indx = parseInt(localname);
                  if (Number.isInteger(indx) && (indx >= 0) && (indx < top._childs.length))
                     return process_child(top._childs[indx]);
               }
            }

            pos = fullname.lastIndexOf('/', pos - 1);
         }

         if (arg.force) {
             // if did not found element with given name we just generate it
             if (top._childs === undefined) top._childs = [];
             pos = fullname.indexOf('/');
             const child = { _name: ((pos < 0) ? fullname : fullname.slice(0, pos)) };
             top._childs.push(child);
             return process_child(child);
         }

         return arg.last_exists ? { last: top, rest: fullname } : null;
      }

      let top = this.h, itemname;

      if (isStr(arg)) {
         itemname = arg;
         arg = {};
      } else if (isObject(arg)) {
         itemname = arg.name;
         if ('top' in arg)
            top = arg.top;
      } else
         return null;

      if (itemname === '__top_folder__')
         return top;

      if (isStr(itemname) && (itemname.indexOf('img:') === 0))
         return null;

      return find_in_hierarchy(top, itemname);
   }

   /** @summary Produce full string name for item
     * @param {Object} node - item element
     * @param {Object} [uptoparent] - up to which parent to continue
     * @param {boolean} [compact] - if specified, top parent is not included
     * @return {string} produced name
     * @private */
   itemFullName(node, uptoparent, compact) {
      if (node?._kind === kTopFolder)
         return '__top_folder__';

      let res = '';

      while (node) {
         // online items never includes top-level folder
         if ((node._online !== undefined) && !uptoparent)
            return res;

         if ((node === uptoparent) || (node._kind === kTopFolder))
            break;
         if (compact && !node._parent)
            break; // in compact form top-parent is not included
         if (res) res = '/' + res;
         res = node._name + res;
         node = node._parent;
      }

      return res;
   }

    /** @summary Executes item marked as 'Command'
      * @desc If command requires additional arguments, they could be specified as extra arguments arg1, arg2, ...
      * @param {String} itemname - name of command item
      * @param {Object} [elem] - HTML element for command execution
      * @param [arg1] - first optional argument
      * @param [arg2] - second optional argument and so on
      * @return {Promise} with command result */
   async executeCommand(itemname, elem, ...userargs) {
      const hitem = this.findItem(itemname),
            url = this.getOnlineItemUrl(hitem) + '/cmd.json',
            d3node = d3_select(elem),
            cmdargs = [];

      for (let n = 0; n < (hitem._numargs ?? 0); ++n)
         cmdargs.push(n < userargs.length ? userargs[n] : '');

      const promise = !cmdargs.length || !elem
                       ? Promise.resolve(cmdargs)
                       : createMenu().then(menu => menu.showCommandArgsDialog(hitem._name, cmdargs));

      return promise.then(args => {
         if (args === null) return false;

         let urlargs = '';
         for (let k = 0; k < args.length; ++k)
            urlargs += `${k>0?'&':'?'}arg${k+1}=${args[k]}`;

        if (!d3node.empty()) {
            d3node.style('background', 'yellow');
            if (hitem._title)
               d3node.attr('title', 'Executing ' + hitem._title);
         }

         return httpRequest(url + urlargs, 'text').then(res => {
            if (d3node.empty()) return res;
            const col = (res && (res !== 'false')) ? 'green' : 'red';
            d3node.style('background', col);
            if (hitem._title)
               d3node.attr('title', hitem._title + ' lastres=' + res);
            setTimeout(() => {
               d3node.style('background', null);
               if (hitem._icon && d3node.classed('jsroot_fastcmd_btn'))
                  d3node.style('background-image', `url('${hitem._icon}')`);
            }, 2000);
            if ((col === 'green') && ('_hreload' in hitem))
               this.reload();
            if ((col === 'green') && ('_update_item' in hitem))
               this.updateItems(hitem._update_item.split(';'));
            return res;
         });
      });
   }

   /** @summary Get object item with specified name
     * @desc depending from provided option, same item can generate different object types
     * @param {Object} arg - item name or config object
     * @param {string} arg.name - item name
     * @param {Object} arg.item - or item itself
     * @param {string} options - supposed draw options
     * @return {Promise} with object like { item, obj, itemname }
     * @private */
   async getObject(arg, options) {
      const result = { item: null, obj: null };
      let itemname, item;

      if (arg === null)
         return result;

      if (isStr(arg))
         itemname = arg;
       else if (isObject(arg)) {
         if ((arg._parent !== undefined) && (arg._name !== undefined) && (arg._kind !== undefined))
            item = arg;
         else if (arg.name !== undefined)
            itemname = arg.name;
         else if (arg.arg !== undefined)
            itemname = arg.arg;
         else if (arg.item !== undefined)
            item = arg.item;
      }

      if (isStr(itemname) && (itemname.indexOf('img:') === 0)) {
         // artificial class, can be created by users
         result.obj = { _typename: 'TJSImage', fName: itemname.slice(4) };
         return result;
      }

      if (item) itemname = this.itemFullName(item);
           else item = this.findItem({ name: itemname, allow_index: true, check_keys: true });

      // if item not found, try to find nearest parent which could allow us to get inside

      const d = item ? null : this.findItem({ name: itemname, last_exists: true, check_keys: true, allow_index: true });

      // if item not found, try to expand hierarchy central function
      // implements not process get in central method of hierarchy item (if exists)
      // if last_parent found, try to expand it
      if ((d !== null) && ('last' in d) && (d.last !== null)) {
         const parentname = this.itemFullName(d.last);

         // this is indication that expand does not give us better path to searched item
         if (isObject(arg) && ('rest' in arg)) {
            if ((arg.rest === d.rest) || (arg.rest.length <= d.rest.length))
               return result;
         }

         return this.expandItem(parentname, undefined, options !== 'hierarchy_expand_verbose').then(res => {
            if (!res) return result;
            let newparentname = this.itemFullName(d.last);
            if (newparentname) newparentname += '/';
            return this.getObject({ name: newparentname + d.rest, rest: d.rest }, options);
         });
      }

      result.item = item;

      if ((item !== null) && isObject(item._obj)) {
         result.obj = item._obj;
         return result;
      }

      // normally search _get method in the parent items
      let curr = item;
      while (curr) {
         if (isFunc(curr._get))
            return curr._get(item, null, options).then(obj => { result.obj = obj; return result; });
         curr = ('_parent' in curr) ? curr._parent : null;
      }

      return result;
   }

   /** @summary returns true if item is last in parent childs list
     * @private */
   isLastSibling(hitem) {
      if (!hitem || !hitem._parent || !hitem._parent._childs)
         return false;
      const chlds = hitem._parent._childs;
      let indx = chlds.indexOf(hitem);
      if (indx < 0)
         return false;
      while (++indx < chlds.length) {
         if (!('_hidden' in chlds[indx]))
            return false;
      }
      return true;
   }

   /** @summary Create item html code
     * @private */
   addItemHtml(hitem, d3prnt, arg) {
      if (!hitem || ('_hidden' in hitem))
         return true;

      const isroot = (hitem === this.h),
            has_childs = ('_childs' in hitem),
            handle = getDrawHandle(hitem._kind),
            itemname = this.itemFullName(hitem);
      let img1 = '', img2 = '', can_click = false, break_list = false, d3cont;

      if (handle) {
         if ('icon' in handle) img1 = handle.icon;
         if ('icon2' in handle) img2 = handle.icon2;
         if (!img1 && isFunc(handle.icon_get))
            img1 = handle.icon_get(hitem, this);
         if (canDrawHandle(handle) || ('execute' in handle) || ('aslink' in handle) ||
             (canExpandHandle(handle) && (hitem._more !== false))) can_click = true;
      }

      if ('_icon' in hitem)
         img1 = hitem._icon;
      if ('_icon2' in hitem)
         img2 = hitem._icon2;
      if (!img1 && ('_online' in hitem))
         hitem._icon = img1 = 'img_globe';
      if (!img1 && isroot)
         hitem._icon = img1 = 'img_base';

      if (hitem._more || hitem._expand || hitem._player || hitem._can_draw)
         can_click = true;

      let can_menu = can_click;
      if (!can_menu && getTypeForKind(hitem._kind))
         can_menu = can_click = true;

      if (!img2) img2 = img1;
      if (!img1) img1 = (has_childs || hitem._more) ? 'img_folder' : 'img_page';
      if (!img2) img2 = (has_childs || hitem._more) ? 'img_folderopen' : 'img_page';

      if (arg === 'update') {
         d3prnt.selectAll('*').remove();
         d3cont = d3prnt;
      } else {
         d3cont = d3prnt.append('div');
         if (arg && (arg >= (hitem._parent._show_limit || settings.HierarchyLimit))) break_list = true;
      }

      hitem._d3cont = d3cont.node(); // set for direct referencing
      d3cont.attr('item', itemname);

      // line with all html elements for this item (excluding childs)
      const h = this, d3line = d3cont.append('div').attr('class', 'h_line');

      // build indent
      let prnt = isroot ? null : hitem._parent, upcnt = 1;
      while (prnt && (prnt !== this.h)) {
         const is_last = this.isLastSibling(prnt),
               d3icon = d3line.insert('div', ':first-child').attr('class', is_last ? 'img_empty' : 'img_line');
         if (!is_last)
            d3icon.style('cursor', 'pointer').property('upcnt', upcnt).on('click', function(evnt) { h.tree_click(evnt, this, 'parentminus'); });
         prnt = prnt._parent; upcnt++;
      }

      let icon_class = '', plusminus = false;

      if (isroot) {
         // for root node no extra code
      } else if ((has_childs && !break_list) || handle?.pm) {
         icon_class = hitem._isopen ? 'img_minus' : 'img_plus';
         plusminus = true;
      } else
         icon_class = 'img_join';

      if (icon_class) {
         if (break_list || this.isLastSibling(hitem)) icon_class += 'bottom';
         const d3icon = d3line.append('div').attr('class', icon_class);
         if (plusminus)
            d3icon.style('cursor', 'pointer').on('click', function(evnt) { h.tree_click(evnt, this, kPM); });
      }

      // make node icons

      if (this.with_icons && !break_list) {
         const icon_name = hitem._isopen ? img2 : img1,
               d3img = (icon_name.indexOf('img_') === 0)
                 ? d3line.append('div')
                          .attr('class', icon_name)
                          .attr('title', hitem._kind)
                 : d3line.append('img')
                          .attr('src', icon_name)
                          .attr('alt', '')
                          .attr('title', hitem._kind)
                          .style('vertical-align', 'top')
                          .style('width', '18px')
                          .style('height', '18px');

         if (hitem._icon_click || handle?.icon_click)
            d3img.on('click', function(evnt) { h.tree_click(evnt, this, 'icon'); });
      }

      const d3a = d3line.append('a');
      if (can_click || has_childs || break_list)
         d3a.attr('class', cssItem).on('click', function(evnt) { h.tree_click(evnt, this); });

      if (break_list) {
         hitem._break_point = true; // indicate that list was broken here
         d3a.attr('title', 'there are ' + (hitem._parent._childs.length - arg) + ' more items')
            .text('...more...');
         return false;
      }

      if ('disp_kind' in h) {
         if (settings.DragAndDrop && can_click)
           this.enableDrag(d3a, itemname);

         if (settings.ContextMenu && can_menu)
            d3a.on('contextmenu', function(evnt) { h.tree_contextmenu(evnt, this); });

         d3a.on('mouseover', function() { h.tree_mouseover(true, this); })
            .on('mouseleave', function() { h.tree_mouseover(false, this); });
      } else if (hitem._direct_context && settings.ContextMenu)
         d3a.on('contextmenu', function(evnt) { h.direct_contextmenu(evnt, this); });

      let element_name = hitem._name, element_title = '';

      if ('_realname' in hitem)
         element_name = hitem._realname;

      if ('_title' in hitem)
         element_title = hitem._title;

      if ('_fullname' in hitem)
         element_title += '  fullname: ' + hitem._fullname;

      if (!element_title)
         element_title = element_name;

      d3a.attr('title', element_title)
         .text(element_name + ('_value' in hitem ? ':' : ''))
         .style('background', hitem._background ? hitem._background : null);

      if ('_value' in hitem) {
         const d3p = d3line.append('p');
         if ('_vclass' in hitem) d3p.attr('class', hitem._vclass);
         if (!hitem._isopen) d3p.html(hitem._value);
      }

      if (has_childs && (isroot || hitem._isopen)) {
         const d3chlds = d3cont.append('div').attr('class', 'h_childs');
         if (this.show_overflow) d3chlds.style('overflow', 'initial');
         for (let i = 0; i < hitem._childs.length; ++i) {
            const chld = hitem._childs[i];
            chld._parent = hitem;
            if (!this.addItemHtml(chld, d3chlds, i)) break; // if too many items, skip rest
         }
      }

      return true;
   }

   /** @summary Toggle open state of the item
     * @desc Used with 'expand all' / 'collapse all' buttons in normal GUI
     * @param {boolean} isopen - if items should be expand or closed
     * @return {boolean} true when any item was changed */
   toggleOpenState(isopen, h, promises) {
      const hitem = h || this.h;

      if (hitem._childs === undefined) {
         if (!isopen) return false;

         if (this.with_icons) {
            // in normal hierarchy check precisely if item can be expand
            if (!hitem._more && !hitem._expand && !this.canExpandItem(hitem))
               return false;
         }

         const pr = this.expandItem(this.itemFullName(hitem));
         if (isPromise(pr) && isObject(promises))
            promises.push(pr);
         if (hitem._childs !== undefined)
            hitem._isopen = true;
         return hitem._isopen;
      }

      if ((hitem !== this.h) && isopen && !hitem._isopen) {
         // when there are childs and they are not see, simply show them
         hitem._isopen = true;
         return true;
      }

      let change_child = false;
      for (let i = 0; i < hitem._childs.length; ++i) {
         if (this.toggleOpenState(isopen, hitem._childs[i], promises))
            change_child = true;
      }

      if ((hitem !== this.h) && !isopen && hitem._isopen && !change_child) {
         // if none of the childs can be closed, than just close that item
         delete hitem._isopen;
         return true;
      }

      if (!h) this.refreshHtml();
      return false;
   }

   /** @summary Expand to specified level
     * @protected */
   async exapndToLevel(level) {
      if (!level || !Number.isFinite(level) || (level < 0))
         return this;

      const promises = [];
      this.toggleOpenState(true, this.h, promises);
      return Promise.all(promises).then(() => this.exapndToLevel(level - 1));
   }

   /** @summary Refresh HTML code of hierarchy painter
     * @return {Promise} when done */
   async refreshHtml() {
      const d3elem = this.selectDom();
      if (d3elem.empty())
         return this;

      d3elem.html('')   // clear html - most simple way
            .style('overflow', this.show_overflow ? 'auto' : 'hidden')
            .style('display', 'flex')
            .style('flex-direction', 'column');

      injectHStyle(d3elem.node());

      const h = this, factcmds = [];
      let status_item = null;
      this.forEachItem(item => {
         delete item._d3cont; // remove html container
         if (('_fastcmd' in item) && (item._kind === 'Command'))
            factcmds.push(item);
         if (('_status' in item) && !status_item)
            status_item = item;
      });

      if (!this.h || d3elem.empty())
         return this;

      if (factcmds.length) {
         const fastbtns = d3elem.append('div').attr('style', 'display: inline; vertical-align: middle; white-space: nowrap;');
         for (let n = 0; n < factcmds.length; ++n) {
            const btn = fastbtns.append('button')
                       .text('')
                       .attr('class', 'jsroot_fastcmd_btn')
                       .attr('item', this.itemFullName(factcmds[n]))
                       .attr('title', factcmds[n]._title)
                       .on('click', function() { h.executeCommand(d3_select(this).attr('item'), this); });

            if (factcmds[n]._icon)
               btn.style('background-image', `url('${factcmds[n]._icon}')`);
         }
      }

      const d3btns = d3elem.append('p').attr('class', 'jsroot').style('margin-bottom', '3px').style('margin-top', 0);
      d3btns.append('a').attr('class', cssButton).text('expand all')
            .attr('title', 'expand all items in the browser').on('click', () => this.toggleOpenState(true));
      d3btns.append('text').text(' | ');
      d3btns.append('a').attr('class', cssButton).text('collapse all')
            .attr('title', 'collapse all items in the browser').on('click', () => this.toggleOpenState(false));

      if (isFunc(this.storeAsJson)) {
         d3btns.append('text').text(' | ');
         d3btns.append('a').attr('class', cssButton).text('json')
               .attr('title', 'dump to json file').on('click', () => this.storeAsJson());
      }

      if (isFunc(this.removeInspector)) {
         d3btns.append('text').text(' | ');
         d3btns.append('a').attr('class', cssButton).text('remove')
               .attr('title', 'remove inspector').on('click', () => this.removeInspector());
      }

      if ('_online' in this.h) {
         d3btns.append('text').text(' | ');
         d3btns.append('a').attr('class', cssButton).text('reload')
               .attr('title', 'reload object list from the server').on('click', () => this.reload());
      }

      if ('disp_kind' in this) {
         d3btns.append('text').text(' | ');
         d3btns.append('a').attr('class', cssButton).text('clear')
               .attr('title', 'clear all drawn objects').on('click', () => this.clearHierarchy(false));
      }

      const maindiv =
         d3elem.append('div')
               .attr('class', 'jsroot')
               .style('font-size', this.with_icons ? '12px' : '15px')
               .style('flex', '1');

      if (!this.show_overflow)
         maindiv.style('overflow', 'auto');

      if (this.background) {
          // case of object inspector and streamer infos display
          maindiv.style('background-color', this.background)
                 .style('margin', '2px').style('padding', '2px');
      }
      if (this.textcolor)
         maindiv.style('color', this.textcolor);

      this.addItemHtml(this.h, maindiv.append('div').attr('class', cssTree));

      this.setTopPainter(); // assign this hierarchy painter as top painter

      if (status_item && !this.status_disabled && !decodeUrl().has('nostatus')) {
         const func = findFunction(status_item._status);
         if (isFunc(func)) {
            return this.createStatusLine().then(sdiv => {
               if (sdiv) func(sdiv, this.itemFullName(status_item));
            });
         }
      }

      return this;
   }

   /** @summary Update item node
     * @private */
   updateTreeNode(hitem, d3cont) {
      if ((d3cont === undefined) || d3cont.empty()) {
         d3cont = d3_select(hitem._d3cont ? hitem._d3cont : null);
         const name = this.itemFullName(hitem);
         if (d3cont.empty())
            d3cont = this.selectDom().select(`[item='${name}']`);
         if (d3cont.empty() && ('_cycle' in hitem))
            d3cont = this.selectDom().select(`[item='${name};${hitem._cycle}']`);
         if (d3cont.empty()) return;
      }

      this.addItemHtml(hitem, d3cont, 'update');

      this.brlayout?.adjustBrowserSize(true);
   }

   /** @summary Update item background
     * @private */
   updateBackground(hitem, scroll_into_view) {
      if (!hitem || !hitem._d3cont)
         return;

      const d3cont = d3_select(hitem._d3cont);
      if (d3cont.empty())
         return;

      const d3a = d3cont.select(`.${cssItem}`);
      d3a.style('background', hitem._background ? hitem._background : null);

      if (scroll_into_view && hitem._background)
         d3a.node().scrollIntoView(false);
   }

   /** @summary Focus on hierarchy item
     * @param {Object|string} hitem - item to open or its name
     * @desc all parents to the item will be opened first
     * @return {Promise} when done
     * @private */
   async focusOnItem(hitem) {
      if (isStr(hitem))
         hitem = this.findItem(hitem);

      const name = hitem ? this.itemFullName(hitem) : '';
      if (!name) return false;

      let itm = hitem, need_refresh = false;

      while (itm) {
         if ((itm._childs !== undefined) && !itm._isopen) {
            itm._isopen = true;
            need_refresh = true;
         }
         itm = itm._parent;
      }

      const promise = need_refresh ? this.refreshHtml() : Promise.resolve(true);

      return promise.then(() => {
         const d3cont = this.selectDom().select(`[item='${name}']`);
         if (d3cont.empty()) return false;
         d3cont.node().scrollIntoView();
         return true;
      });
   }

   /** @summary Handler for click event of item in the hierarchy
     * @private */
   tree_click(evnt, node, place) {
      if (!node) return;

      let d3cont = d3_select(node.parentNode.parentNode),
          itemname = d3cont.attr('item'),
          hitem = itemname ? this.findItem(itemname) : null;

      if (!hitem) return;

      if (place === 'parentminus') {
         let upcnt = d3_select(node).property('upcnt') || 1;
         while (upcnt-- > 0)
            hitem = hitem?._parent;
         if (!hitem)
            return;
         itemname = this.itemFullName(hitem);
         d3cont = d3_select(hitem?._d3cont || null);
         place = kPM;
      }

      if (hitem._break_point) {
         // special case of more item

         delete hitem._break_point;

         // update item itself
         this.addItemHtml(hitem, d3cont, 'update');

         const prnt = hitem._parent, indx = prnt._childs.indexOf(hitem),
               d3chlds = d3_select(d3cont.node().parentNode);

         if (indx < 0)
            return console.error('internal error');

         prnt._show_limit = (prnt._show_limit || settings.HierarchyLimit) * 2;

         for (let n = indx + 1; n < prnt._childs.length; ++n) {
            const chld = prnt._childs[n];
            chld._parent = prnt;
            if (!this.addItemHtml(chld, d3chlds, n)) break; // if too many items, skip rest
         }

         return;
      }

      let prnt = hitem, dflt;
      while (prnt) {
         if ((dflt = prnt._click_action) !== undefined) break;
         prnt = prnt._parent;
      }

      if (!place)
         place = 'item';
      const selector = (hitem._kind === getKindForType(clTKey) && hitem._more) ? 'noinspect' : '',
            sett = getDrawSettings(hitem._kind, selector), handle = sett.handle;

      if (place === 'icon') {
         let func = null;
         if (isFunc(hitem._icon_click))
            func = hitem._icon_click;
         else if (isFunc(handle?.icon_click))
            func = handle.icon_click;
         if (func && func(hitem, this))
            this.updateTreeNode(hitem, d3cont);
         return;
      }

      // special feature - all items with '_expand' function are not drawn by click
      if ((place === 'item') && ('_expand' in hitem) && !evnt.ctrlKey && !evnt.shiftKey)
         place = kPM;

      // special case - one should expand item
      if (((place === kPM) && !('_childs' in hitem) && hitem._more) ||
          ((place === kPM) && handle?.pm) ||
          ((place === 'item') && (dflt === kExpand)))
         return this.expandItem(itemname, d3cont);

      if (place === 'item') {
         if (hitem._player)
            return this.player(itemname);

         if (handle?.aslink)
            return window.open(itemname + '/');

         if (handle?.execute)
            return this.executeCommand(itemname, node.parentNode);

         if (handle?.ignore_online && this.isOnlineItem(hitem))
            return;

         const dflt_expand = (this.default_by_click === kExpand);
         let can_draw = hitem._can_draw,
             can_expand = hitem._more,
             drawopt = '';

         if (evnt.shiftKey) {
            drawopt = handle?.shift || kInspect;
            if (isStr(drawopt) && (drawopt.indexOf(kInspect) === 0) && handle?.noinspect)
               drawopt = '';
         }
         if (evnt.ctrlKey && handle?.ctrl)
            drawopt = handle.ctrl;

         if (!drawopt && !handle?.always_draw) {
            for (let pitem = hitem._parent; pitem; pitem = pitem._parent) {
               if (pitem._painter) {
                  can_draw = false;
                  if (can_expand === undefined)
                     can_expand = false;
                  break;
               }
            }
         }

         if (hitem._childs)
            can_expand = false;

         if (can_draw === undefined)
            can_draw = sett.draw;
         if (can_expand === undefined)
            can_expand = sett.expand || sett.get_expand;

         if (can_draw && can_expand && !drawopt) {
            // if default action specified as expand, disable drawing
            // if already displayed, try to expand
            if (dflt_expand || (handle?.dflt === kExpand) || (handle?.exapnd_after_draw && this.isItemDisplayed(itemname))) can_draw = false;
         }

         if (can_draw && !drawopt)
            drawopt = kDfltDrawOpt;

         if (can_draw)
            return this.display(itemname, drawopt, null, true);

         if (can_expand || dflt_expand)
            return this.expandItem(itemname, d3cont);

         // cannot draw, but can inspect ROOT objects
         if (getTypeForKind(hitem._kind) && sett.inspect && (can_draw !== false))
            return this.display(itemname, kInspect, null, true);

         if (!hitem._childs || (hitem === this.h))
            return;
      }

      if (hitem._isopen)
         delete hitem._isopen;
      else
         hitem._isopen = true;

      this.updateTreeNode(hitem, d3cont);
   }

   /** @summary Handler for mouse-over event
     * @private */
   tree_mouseover(on, elem) {
      const itemname = d3_select(elem.parentNode.parentNode).attr('item'),
            hitem = this.findItem(itemname);

      if (!hitem) return;

      let painter, prnt = hitem;
      while (prnt && !painter) {
         painter = prnt._painter;
         prnt = prnt._parent;
      }

      if (isFunc(painter?.mouseOverHierarchy))
         painter.mouseOverHierarchy(on, itemname, hitem);
   }

   /** @summary alternative context menu, used in the object inspector
     * @private */
   direct_contextmenu(evnt, elem) {
      evnt.preventDefault();
      const itemname = d3_select(elem.parentNode.parentNode).attr('item'),
           hitem = this.findItem(itemname);
      if (!hitem) return;

      if (isFunc(this.fill_context)) {
         createMenu(evnt, this).then(menu => {
            this.fill_context(menu, hitem);
            if (menu.size() > 0) {
               menu.tree_node = elem.parentNode;
               menu.show();
            }
         });
      }
   }

   /** @summary Fills settings menu items
     * @private */
   fillSettingsMenu(menu, alone) {
      menu.addSettingsMenu(true, alone, arg => {
         if (arg === 'refresh') {
            this.forEachRootFile(folder => keysHierarchy(folder, folder._file.fKeys, folder._file, ''));
            this.refreshHtml();
         } else if (arg === 'dark')
            this.changeDarkMode();
         else if (arg === 'width')
            this.brlayout?.adjustSeparators(settings.BrowserWidth, null);
      });
   }

   /** @summary Handle changes of dark mode
     * @private */
   changeDarkMode() {
      if (this.textcolor) {
         this.setBasicColors();
         this.refreshHtml();
      }

      this.brlayout?.createStyle();
      this.createButtons(); // recreate buttons
      if (isFunc(this.disp?.changeDarkMode))
         this.disp.changeDarkMode();
      this.disp?.forEachFrame(frame => {
         let p = getElementCanvPainter(frame);
         if (!p) p = getElementMainPainter(frame);
         if (isFunc(p?.changeDarkMode) && (p !== this))
            p.changeDarkMode();
      });
   }

   /** @summary Toggle dark mode
     * @private */
   toggleDarkMode() {
      settings.DarkMode = !settings.DarkMode;
      this.changeDarkMode();
   }

   /** @summary Handle context menu in the hierarchy
     * @private */
   tree_contextmenu(evnt, elem) {
      evnt.preventDefault();
      const itemname = d3_select(elem.parentNode.parentNode).attr('item'),
             hitem = this.findItem(itemname);
      if (!hitem) return;

      const onlineprop = this.getOnlineProp(itemname),
            fileprop = this.getFileProp(itemname);

      function qualifyURL(url) {
         const escapeHTML = s => s.split('&').join('&amp;').split('<').join('&lt;').split('"').join('&quot;'),
               el = document.createElement('div');
         el.innerHTML = `<a href="${escapeHTML(url)}">x</a>`;
         return el.firstChild.href;
      }

      createMenu(evnt, this).then(menu => {
         if ((!itemname || !hitem._parent) && !('_jsonfile' in hitem)) {
            let addr = '', cnt = 0;
            const files = [], separ = () => (cnt++ > 0) ? '&' : '?';

            this.forEachRootFile(item => files.push(item._file.fFullURL));

            if (!this.getTopOnlineItem())
               addr = source_dir + 'index.htm';

            if (this.isMonitoring())
               addr += separ() + 'monitoring=' + this.getMonitoringInterval();

            if (files.length === 1)
               addr += `${separ()}file=${files[0]}`;
            else if (files.length > 1)
               addr += `${separ()}files=${JSON.stringify(files)}`;

            if (this.disp_kind)
               addr += separ() + 'layout=' + this.disp_kind.replace(/ /g, '');

            const items = [], opts = [];

            this.disp?.forEachFrame(frame => {
               const dummy = new ObjectPainter(frame);
               let top = dummy.getTopPainter(),
                   item = top ? top.getItemName() : null, opt;

               if (item)
                  opt = top.getDrawOpt() || top.getItemDrawOpt();
                else {
                  top = null;
                  dummy.forEachPainter(p => {
                     const _item = p.getItemName();
                     if (!_item) return;
                     let _opt = p.getDrawOpt() || p.getItemDrawOpt() || '';
                     if (!top) {
                        top = p;
                        item = _item;
                        opt = _opt;
                     } else if (top.getPadPainter() === p.getPadPainter()) {
                        if (_opt.indexOf('same ') === 0)
                           _opt = _opt.slice(5);
                        item += '+' + _item;
                        opt += '+' + _opt;
                     }
                  });
               }

               if (item) {
                  items.push(item);
                  opts.push(opt || '');
               }
            });

            if (items.length === 1)
               addr += separ() + 'item=' + items[0] + separ() + 'opt=' + opts[0];
             else if (items.length > 1)
               addr += separ() + 'items=' + JSON.stringify(items) + separ() + 'opts=' + JSON.stringify(opts);


            menu.add('Direct link', () => window.open(addr));
            menu.add('Only items', () => window.open(addr + '&nobrowser'));
            this.fillSettingsMenu(menu);
         } else if (onlineprop)
            this.fillOnlineMenu(menu, onlineprop, itemname);
          else {
            const sett = getDrawSettings(hitem._kind, 'nosame');

            // allow to draw item even if draw function is not defined
            if (hitem._can_draw) {
               if (!sett.opts) sett.opts = [''];
               if (sett.opts.indexOf('') < 0)
                  sett.opts.unshift('');
            }

            if (sett.opts) {
               menu.addDrawMenu('Draw', sett.opts, arg => this.display(itemname, arg),
                                'Draw item in the new frame');

               const active_frame = this.disp?.getActiveFrame();

               if (!sett.noappend && active_frame && (getElementCanvPainter(active_frame) || getElementMainPainter(active_frame))) {
                  menu.addDrawMenu('Superimpose', sett.opts, arg => this.dropItem(itemname, active_frame, arg),
                                   'Superimpose item with drawing on active frame');
               }
            }

            if (fileprop && sett.opts && !fileprop.localfile) {
               const url = settings.NewTabUrl || source_dir;
               let filepath = qualifyURL(fileprop.fileurl);
               if (filepath.indexOf(url) === 0)
                  filepath = filepath.slice(url.length);
               filepath = `${fileprop.kind}=${filepath}`;
               if (fileprop.itemname) {
                  let name = fileprop.itemname;
                  if (name.search(/\+| |,/) >= 0) name = `'${name}'`;
                  filepath += `&item=${name}`;
               }

               let arg0 = 'nobrowser';
               if (settings.WithCredentials)
                  arg0 += '&with_credentials';
               if (settings.NewTabUrlPars)
                  arg0 += '&' + settings.NewTabUrlPars;
               if (settings.NewTabUrlExportSettings) {
                  if (gStyle.fOptStat !== 1111)
                     arg0 += `&optstat=${gStyle.fOptStat}`;
                  if (gStyle.fOptFit)
                     arg0 += `&optfit=${gStyle.fOptFit}`;
                  if (gStyle.fOptDate)
                     arg0 += `&optdate=${gStyle.fOptDate}`;
                  if (gStyle.fOptFile)
                     arg0 += `&optfile=${gStyle.fOptFile}`;
                  if (gStyle.fOptTitle !== 1)
                     arg0 += `&opttitle=${gStyle.fOptTitle}`;
                  if (settings.TimeZone === 'UTC')
                     arg0 += '&utc';
                  else if (settings.TimeZone === 'Europe/Berlin')
                     arg0 += '&cet';
                  else if (settings.TimeZone)
                     arg0 += `&timezone='${settings.TimeZone}'`;
                  if (Math.abs(gStyle.fDateX - 0.01) > 1e-3)
                     arg0 += `&datex=${gStyle.fDateX.toFixed(3)}`;
                  if (Math.abs(gStyle.fDateY - 0.01) > 1e-3)
                     arg0 += `&datey=${gStyle.fDateY.toFixed(3)}`;
                  if (gStyle.fHistMinimumZero)
                     arg0 += '&histzero';
                  if (settings.DarkMode)
                     arg0 += '&dark=on';
                  if (!settings.UseStamp)
                     arg0 += '&usestamp=off';
                  if (settings.OnlyLastCycle)
                     arg0 += '&lastcycle';
                  if (settings.OptimizeDraw !== 1)
                     arg0 += `&optimize=${settings.OptimizeDraw}`;
                  if (settings.MaxRanges !== 200)
                     arg0 += `&maxranges=${settings.MaxRanges}`;
                  if (settings.FuncAsCurve)
                     arg0 += '&tf1=curve';
                  if (!settings.ToolBar && !settings.Tooltip && !settings.ContextMenu && !settings.Zooming && !settings.MoveResize && !settings.DragAndDrop)
                     arg0 += '&interactive=0';
                  else if (!settings.ContextMenu)
                     arg0 += '&nomenu';
               }

               menu.addDrawMenu('Draw in new tab', sett.opts,
                                arg => window.open(`${url}?${arg0}&${filepath}&opt=${arg}`),
                                'Draw item in the new browser tab or window');
            }

            if ((sett.expand || sett.get_expand) && (hitem._more || hitem._more === undefined)) {
               if (hitem._childs === undefined)
                  menu.add('Expand', () => this.expandItem(itemname), 'Exapnd content of object');
               else {
                  menu.add('Unexpand', () => {
                     hitem._more = true;
                     delete hitem._childs;
                     delete hitem._isopen;
                     if (hitem.expand_item)
                        delete hitem._expand;
                     this.updateTreeNode(hitem);
                  }, 'Remove all childs from hierarchy');
               }
            }

            if (hitem._kind === getKindForType(clTStyle))
               menu.add('Apply', () => this.applyStyle(itemname));
         }

         if (isFunc(hitem._menu))
            hitem._menu(menu, hitem, this);

         if (menu.size() > 0) {
            menu.tree_node = elem.parentNode;
            if (menu.separ) menu.separator(); // add separator at the end
            menu.add('Close');
            menu.show();
         }
      }); // end menu creation

      return false;
   }

   /** @summary Starts player for specified item
     * @desc Same as 'Player' context menu
     * @param {string} itemname - item name for which player should be started
     * @param {string} [option] - extra options for the player
     * @return {Promise} when ready */
   async player(itemname, option) {
      const item = this.findItem(itemname);

      if (!isStr(item?._player))
         return null;

      let player_func;

      if (item._module) {
         const hh = await this.importModule(item._module);
         player_func = hh ? hh[item._player] : null;
      } else {
         if (item._prereq || (item._player.indexOf('JSROOT.') >= 0))
            await this.loadScripts('', item._prereq);
         player_func = findFunction(item._player);
      }

      if (!isFunc(player_func))
         return null;

      await this.createDisplay();
      return player_func(this, itemname, option);
   }

   /** @summary Checks if item can be displayed with given draw option
     * @private */
   canDisplay(item, drawopt) {
      if (!item)
         return false;
      if (item._player)
         return true;
      if (item._can_draw !== undefined)
         return item._can_draw;
      if (isStr(drawopt) && (drawopt.indexOf(kInspect) === 0))
         return true;
      const handle = getDrawHandle(item._kind, drawopt);
      return canDrawHandle(handle);
   }

   /** @summary Returns true if given item displayed
     * @param {string} itemname - item name */
   isItemDisplayed(itemname) {
      const mdi = this.getDisplay();
      return mdi?.findFrame(itemname) !== null;
   }

   /** @summary Display specified item
     * @param {string} itemname - item name
     * @param {string} [drawopt] - draw option for the item
     * @param {string|Object} [dom] - place where to draw item, same as for @ref draw function
     * @param {boolean} [interactive] - if display was called in interactive mode, will activate selected drawing
     * @return {Promise} with created painter object */
   async display(itemname, drawopt, dom = null, interactive = false) {
      const display_itemname = itemname;
      let painter = null,
          updating = false,
          item = null,
          frame_name = itemname;

      // only to support old API where dom was not there
      if ((dom === true) || (dom === false)) {
         interactive = dom; dom = null;
      }

      if (isStr(dom) && (dom.indexOf('frame:') === 0)) {
         frame_name = dom.slice(6);
         dom = null;
      }

      const complete = (respainter, err) => {
         if (err)
            console.log('When display ', itemname, 'got', err);

         if (updating && item)
            delete item._doing_update;
         if (!updating)
            showProgress();
         if (isFunc(respainter?.setItemName)) {
            respainter.setItemName(display_itemname, updating ? null : drawopt, this); // mark painter as created from hierarchy

            if (item && !item._painter)
               item._painter = respainter;
         }

         return respainter || painter;
      };

      return this.createDisplay().then(mdi => {
         if (!mdi)
            return complete();

         item = this.findItem(display_itemname);

         if (item?._player)
            return this.player(display_itemname, drawopt).then(res => complete(res));

         updating = isStr(drawopt) && (drawopt.indexOf('update:') === 0);

         if (updating) {
            drawopt = drawopt.slice(7);
            if (!item || item._doing_update)
               return complete();
            item._doing_update = true;
         }

         if (item && !this.canDisplay(item, drawopt))
            return complete();

         const use_dflt_opt = drawopt === kDfltDrawOpt;
         if (use_dflt_opt)
            drawopt = '';

         if (!updating)
            showProgress(`Loading ${display_itemname} ...`);

         return this.getObject(display_itemname, drawopt).then(result => {
            if (!updating)
               showProgress();

            if (!item) item = result.item;
            let obj = result.obj;

            if (!obj) return complete();

            if (!updating) showProgress(`Drawing ${display_itemname} ...`);

            let handle = obj._typename ? getDrawHandle(getKindForType(obj._typename)) : null;

            if (handle?.draw_field && obj[handle.draw_field]) {
               obj = obj[handle.draw_field];
               if (!drawopt) drawopt = handle.draw_field_opt || '';
               handle = obj._typename ? getDrawHandle(getKindForType(obj._typename)) : null;
            }

            if (use_dflt_opt && !drawopt && handle?.dflt && (handle.dflt !== kExpand))
               drawopt = handle.dflt;

            if (dom) {
               const func = updating ? redraw : draw;
               return func(dom, obj, drawopt).then(p => complete(p)).catch(err => complete(null, err));
            }

            let did_activate = false;
            const arr = [];

            mdi.forEachPainter((p, frame) => {
               if (p.getItemName() !== display_itemname)
                  return;

               const itemopt = p.getItemDrawOpt();
               if (use_dflt_opt && interactive)
                  drawopt = itemopt;

               // verify that object was drawn with same option as specified now (if any)
               if (!updating && drawopt && (itemopt !== drawopt))
                  return;

               if (interactive && !did_activate) {
                  did_activate = true;
                  mdi.activateFrame(frame);
               }

               if (isFunc(p.redrawObject)) {
                  const pr = p.redrawObject(obj, drawopt);

                  if (pr) {
                     painter = p;
                     arr.push(pr);
                  }
               }
            });

            if (painter)
               return Promise.all(arr).then(() => complete());

            if (updating) {
               console.warn(`something went wrong - did not found painter when doing update of ${display_itemname}`);
               return complete();
            }

            const frame = mdi.findFrame(frame_name, true);
            cleanup(frame);
            mdi.activateFrame(frame);

            return draw(frame, obj, drawopt)
                         .then(p => complete(p))
                         .catch(err => complete(null, err));
         });
      });
   }

   /** @summary Enable drag of the element
     * @private  */
   enableDrag(d3elem /* , itemname */) {
      d3elem.attr('draggable', 'true').on('dragstart', function(ev) {
         const itemname = this.parentNode.parentNode.getAttribute('item');
         ev.dataTransfer.setData('item', itemname);
      });
   }

   /** @summary Enable drop on the frame
     * @private  */
   enableDrop(frame) {
      const h = this;
      d3_select(frame).on('dragover', ev => {
         const itemname = ev.dataTransfer.getData('item'),
              ditem = h.findItem(itemname);
         if (getTypeForKind(ditem?._kind))
            ev.preventDefault(); // let accept drop, otherwise it will be refused
      }).on('dragenter', function() {
         d3_select(this).classed('jsroot_drag_area', true);
      }).on('dragleave', function() {
         d3_select(this).classed('jsroot_drag_area', false);
      }).on('drop', function(ev) {
         d3_select(this).classed('jsroot_drag_area', false);
         const itemname = ev.dataTransfer.getData('item');
         if (!itemname)
            return;
         const painters = [], elements = [];
         let pad_painter = getElementCanvPainter(this),
             target = ev.target;
         pad_painter?.forEachPainter(pp => {
            painters.push(pp);
            elements.push(pp.getPadSvg().node());
         }, 'pads');
         // only if there are sub-pads - try to find them
         if (painters.length > 1) {
            while (target && (target !== this)) {
               const p = elements.indexOf(target);
               if (p > 0) {
                  pad_painter = painters[p];
                  break;
               }
               target = target.parentNode;
            }
         }
         h.dropItem(itemname, pad_painter || this);
      });
   }

   /** @summary Remove all drop handlers on the frame
     * @private  */
   clearDrop(frame) {
      d3_select(frame).on('dragover', null).on('dragenter', null).on('dragleave', null).on('drop', null);
   }

  /** @summary Drop item on specified element for drawing
    * @return {Promise} when completed
    * @private */
   async dropItem(itemname, dom, opt) {
      if (!opt || !isStr(opt)) opt = '';

      const drop_complete = (drop_painter, is_main) => {
         if (!is_main && isFunc(drop_painter?.setItemName))
            drop_painter.setItemName(itemname, null, this);
         return drop_painter;
      };

      if (itemname === '$legend') {
         const cp = getElementCanvPainter(dom);
         if (isFunc(cp?.buildLegend))
            return cp.buildLegend(0, 0, 0, 0, '', opt).then(lp => drop_complete(lp));
         console.error('Not possible to build legend');
         return drop_complete(null);
      }

      return this.getObject(itemname).then(res => {
         if (!res.obj) return null;

         const mp = getElementMainPainter(dom);

         if (isFunc(mp?.performDrop))
            return mp.performDrop(res.obj, itemname, res.item, opt).then(p => drop_complete(p, mp === p));

         const sett = res.obj._typename ? getDrawSettings(getKindForType(res.obj._typename)) : null;
         if (!sett?.draw)
            return null;

         const cp = getElementCanvPainter(dom);

         if (cp) {
            if (sett?.has_same && mp)
               opt = 'same ' + opt;
         } else
            this.cleanupFrame(dom);

         // if drop on sub-pad painter - call add pad buttons
         if (isFunc(dom?.addPadButtons))
            dom.addPadButtons();

         return draw(dom, res.obj, opt).then(p => drop_complete(p, mp === p));
      });
   }

   /** @summary Update specified items
     * @desc Method can be used to fetch new objects and update all existing drawings
     * @param {string|array|boolean} arg - either item name or array of items names to update or true if only automatic items will be updated
     * @return {Promise} when ready */
   async updateItems(arg) {
      if (!this.disp)
         return false;

      const allitems = [], options = [];
      let only_auto_items = false, want_update_all = false;

      if (isStr(arg))
         arg = [arg];
      else if (!isObject(arg)) {
         if (arg === undefined)
           arg = !this.isMonitoring();
         want_update_all = true;
         only_auto_items = Boolean(arg);
      }

      // first collect items
      this.disp.forEachPainter(p => {
         const itemname = p.getItemName();

         if (!isStr(itemname) || (allitems.indexOf(itemname) >= 0))
            return;

         if (want_update_all) {
            const item = this.findItem(itemname);
            if (!item || item._not_monitor || item._player)
               return;
            if (!('_always_monitor' in item)) {
               const handle = getDrawHandle(item._kind);
               let forced = false;
               if (handle?.monitor !== undefined) {
                  if ((handle.monitor === false) || (handle.monitor === 'never'))
                     return;
                  if (handle.monitor === 'always') forced = true;
               }
               if (!forced && only_auto_items) return;
            }
         } else if (arg.indexOf(itemname) < 0)
            return;

         allitems.push(itemname);
         options.push('update:' + p.getItemDrawOpt());
      }, true); // only visible panels are considered

      // force all files to read again (normally in non-browser mode)
      if (this.files_monitoring && !only_auto_items && want_update_all) {
         this.forEachRootFile(item => {
            this.forEachItem(fitem => { delete fitem._readobj; }, item);
            delete item._file;
         });
      }

      return this.displayItems(allitems, options);
   }

   /** @summary Display all provided elements
     * @return {Promise} when drawing finished
     * @private */
   async displayItems(items, options) {
      if (!items?.length)
         return true;

      const h = this;

      if (!options) options = [];
      while (options.length < items.length)
         options.push(kDfltDrawOpt);

      if ((options.length === 1) && (options[0] === 'iotest')) {
         this.clearHierarchy();
         d3_select('#' + this.disp_frameid).html('<h2>Start I/O test</h2>');

         const tm0 = new Date();
         return this.getObject(items[0]).then(() => {
            const tm1 = new Date();
            d3_select('#' + this.disp_frameid).append('h2').html('Item ' + items[0] + ' reading time = ' + (tm1.getTime() - tm0.getTime()) + 'ms');
            return true;
         });
      }

      const dropitems = new Array(items.length),
            dropopts = new Array(items.length),
            images = new Array(items.length);

      // First of all check that items are exists, look for cycle extension and plus sign
      for (let i = 0; i < items.length; ++i) {
         dropitems[i] = dropopts[i] = null;

         const item = items[i];
         let can_split = true;

         if (item?.indexOf('img:') === 0) { images[i] = true; continue; }

         if ((item?.length > 1) && (item.at(0) === '\'') && (item.at(-1) === '\'')) {
            items[i] = item.slice(1, item.length - 1);
            can_split = false;
         }

         let elem = h.findItem({ name: items[i], check_keys: true });
         if (elem) { items[i] = h.itemFullName(elem); continue; }

         if (can_split && (items[i].at(0) === '[') && (items[i].at(-1) === ']')) {
            dropitems[i] = parseAsArray(items[i]);
            items[i] = dropitems[i].shift();
         } else if (can_split && (items[i].indexOf('+') > 0)) {
            dropitems[i] = items[i].split('+');
            items[i] = dropitems[i].shift();
         }

         if (dropitems[i]?.length) {
            // allow to specify _same_ item in different file
            for (let j = 0; j < dropitems[i].length; ++j) {
               const pos = dropitems[i][j].indexOf('_same_');
               if ((pos > 0) && (h.findItem(dropitems[i][j]) === null))
                  dropitems[i][j] = dropitems[i][j].slice(0, pos) + items[i].slice(pos);

               elem = h.findItem({ name: dropitems[i][j], check_keys: true });
               if (elem) dropitems[i][j] = h.itemFullName(elem);
            }

            if ((options[i].at(0) === '[') && (options[i].at(-1) === ']')) {
               dropopts[i] = parseAsArray(options[i]);
               options[i] = dropopts[i].shift();
            } else if (options[i].indexOf('+') > 0) {
               dropopts[i] = options[i].split('+');
               options[i] = dropopts[i].shift();
            } else
               dropopts[i] = [];


            while (dropopts[i].length < dropitems[i].length)
               dropopts[i].push('');
         }

         // also check if subsequent items has _same_, than use name from first item
         const pos = items[i].indexOf('_same_');
         if ((pos > 0) && !h.findItem(items[i]) && (i > 0))
            items[i] = items[i].slice(0, pos) + items[0].slice(pos);

         elem = h.findItem({ name: items[i], check_keys: true });
         if (elem) items[i] = h.itemFullName(elem);
      }

      // now check that items can be displayed
      for (let n = items.length - 1; n >= 0; --n) {
         if (images[n]) continue;
         const hitem = h.findItem(items[n]);
         if (!hitem || h.canDisplay(hitem, options[n])) continue;
         // try to expand specified item
         h.expandItem(items[n], null, true);
         items.splice(n, 1);
         options.splice(n, 1);
         dropitems.splice(n, 1);
      }

      if (!items.length)
         return true;

      const frame_names = new Array(items.length), items_wait = new Array(items.length);
      for (let n = 0; n < items.length; ++n) {
         items_wait[n] = 0;
         let fname = items[n], k = 0;
         if (items.indexOf(fname) < n)
            items_wait[n] = true; // if same item specified, one should wait first drawing before start next
         const p = options[n].indexOf('frameid:');
         if (p >= 0) {
            fname = options[n].slice(p+8);
            options[n] = options[n].slice(0, p);
         } else {
            while (frame_names.indexOf(fname) >= 0)
               fname = items[n] + '_' + k++;
         }
         frame_names[n] = fname;
      }

      // now check if several same items present - select only one for the drawing
      // if draw option includes 'main', such item will be drawn first
      for (let n = 0; n < items.length; ++n) {
         if (items_wait[n] !== 0)
            continue;
         let found_main = n;
         for (let k = 0; k < items.length; ++k) {
            if ((items[n] === items[k]) && (options[k].indexOf('main') >= 0))
               found_main = k;
         }
         for (let k = 0; k < items.length; ++k) {
            if (items[n] === items[k])
               items_wait[k] = (found_main !== k);
         }
      }

      return this.createDisplay().then(mdi => {
         if (!mdi)
            return false;

         const doms = new Array(items.length);

         // Than create empty frames for each item
         for (let i = 0; i < items.length; ++i) {
            if (options[i].indexOf('update:')) {
               mdi.createFrame(frame_names[i]);
               doms[i] = 'frame:' + frame_names[i];
            }
         }

         function dropNextItem(indx, painter) {
            if (painter && dropitems[indx]?.length)
               return h.dropItem(dropitems[indx].shift(), painter.getDrawDom(), dropopts[indx].shift()).then(() => dropNextItem(indx, painter));

            dropitems[indx] = null; // mark that all drop items are processed
            items[indx] = null; // mark item as ready

            for (let cnt = 0; cnt < items.length; ++cnt) {
               if (items[cnt] === null) continue; // ignore completed item
               if (items_wait[cnt] && items.indexOf(items[cnt]) === cnt) {
                  items_wait[cnt] = false;
                  return h.display(items[cnt], options[cnt], doms[cnt]).then(drop_painter => dropNextItem(cnt, drop_painter));
               }
            }
         }

         const promises = [];

         if (this.#one_by_one) {
            function processNext(indx) {
               if (indx >= items.length)
                  return true;
               if (items_wait[indx])
                  return processNext(indx + 1);
                return h.display(items[indx], options[indx], doms[indx])
                        .then(painter => dropNextItem(indx, painter))
                        .then(() => processNext(indx + 1));
            }
            promises.push(processNext(0));
         } else {
            // We start display of all items parallel, but only if they are not the same
            for (let i = 0; i < items.length; ++i) {
               if (!items_wait[i])
                  promises.push(h.display(items[i], options[i], doms[i]).then(painter => dropNextItem(i, painter)));
            }
         }

         return Promise.all(promises).then(() => {
            if (mdi?.createFinalBatchFrame && isBatchMode() && !isNodeJs())
               mdi.createFinalBatchFrame();
         });
      });
   }

   /** @summary Reload hierarchy and refresh html code
     * @return {Promise} when completed */
   async reload() {
      if ('_online' in this.h)
         return this.openOnline(this.h._online).then(() => this.refreshHtml());
      return false;
   }

   /** @summary activate (select) specified item
     * @param {Array} items - array of items names
     * @param {boolean} [force] - if specified, all required sub-levels will be opened
     * @private */
   activateItems(items, force) {
      if (isStr(items))
         items = [items];

      const active = [], // array of elements to activate
            update = []; // array of elements to update
      this.forEachItem(item => { if (item._background) { active.push(item); delete item._background; } });

      const find_next = (itemname, prev_found) => {
         if (itemname === undefined) {
            // extract next element
            if (!items.length) {
               update.reverse().forEach(node => this.updateTreeNode(node));
               active.forEach(item => this.updateBackground(item, force));
               return;
            }
            itemname = items.shift();
         }

         let hitem = this.findItem(itemname);

         if (!hitem) {
            const d = this.findItem({ name: itemname, last_exists: true, check_keys: true, allow_index: true });
            if (!d || !d.last)
               return find_next();
            d.now_found = this.itemFullName(d.last);

            if (force) {
               // if after last expand no better solution found - skip it
               if ((prev_found !== undefined) && (d.now_found === prev_found))
                  return find_next();

               return this.expandItem(d.now_found).then(res => {
                  if (!res) return find_next();
                  let newname = this.itemFullName(d.last);
                  if (newname) newname += '/';
                  find_next(newname + d.rest, d.now_found);
               });
            }
            hitem = d.last;
         }

         if (hitem) {
            // check that item is visible (opened), otherwise should enable parent

            let prnt = hitem._parent;
            while (prnt) {
               if (!prnt._isopen) {
                  if (force) {
                     prnt._isopen = true;
                     if (update.indexOf(prnt) < 0) update.push(prnt);
                  } else {
                     hitem = prnt; break;
                  }
               }
               prnt = prnt._parent;
            }

            hitem._background = 'LightSteelBlue';
            if (active.indexOf(hitem) < 0)
               active.push(hitem);
         }

         find_next();
      };

      if (force && this.brlayout) {
         if (!this.brlayout.browser_kind)
           return this.createBrowser('float', true).then(() => find_next());
         if (!this.brlayout.browser_visible)
            this.brlayout.toggleBrowserVisisbility();
      }

      // use recursion
      find_next();
   }

   /** @summary Check if item can be (potentially) expand
     * @private */
   canExpandItem(item) {
      if (!item)
         return false;
      if (item._expand)
         return true;
      const handle = getDrawHandle(item._kind, '::expand');
      return handle && canExpandHandle(handle);
   }

   /** @summary expand specified item
     * @param {String} itemname - item name
     * @return {Promise} when ready */
   async expandItem(itemname, d3cont, silent) {
      const hitem = this.findItem(itemname), hpainter = this;

      if (!hitem && d3cont)
         return;

      async function doExpandItem(_item, _obj) {
         if (isStr(_item._expand))
            _item._expand = findFunction(_item._expand);

         if (!isFunc(_item._expand)) {
            let handle = getDrawHandle(_item._kind, '::expand');

            // in inspector show all members
            if (handle?.expand_item && !hpainter._inspector) {
               _obj = _obj[handle.expand_item];
               _item.expand_item = handle.expand_item; // remember that was expand item
               handle = _obj?._typename ? getDrawHandle(getKindForType(_obj._typename), '::expand') : null;
            }

            if (handle?.expand || handle?.get_expand) {
               if (isFunc(handle.expand))
                  _item._expand = handle.expand;
               else if (isStr(handle.expand)) {
                  if (!internals.ignore_v6) {
                     const v6 = await _ensureJSROOT();
                     await v6.require(handle.prereq);
                     await v6._complete_loading();
                  }
                  _item._expand = handle.expand = findFunction(handle.expand);
               } else if (isFunc(handle.get_expand))
                  _item._expand = handle.expand = await handle.get_expand();
            }
         }

         // try to use expand function
         if (_obj && isFunc(_item._expand)) {
            const res = _item._expand(_item, _obj);
            if (res) {
               return getPromise(res).then(() => {
                  _item._isopen = true;
                  if (_item._parent && !_item._parent._isopen) {
                     _item._parent._isopen = true; // also show parent
                     if (!silent)
                        hpainter.updateTreeNode(_item._parent);
                  } else if (!silent)
                     hpainter.updateTreeNode(_item, d3cont);
                  return _item;
               });
            }
         }

         if (_obj && objectHierarchy(_item, _obj)) {
            _item._isopen = true;
            if (_item._parent && !_item._parent._isopen) {
               _item._parent._isopen = true; // also show parent
               if (!silent) hpainter.updateTreeNode(_item._parent);
            } else if (!silent)
               hpainter.updateTreeNode(_item, d3cont);
            return _item;
         }

         return -1;
      }

      let promise = Promise.resolve(-1);

      if (hitem) {
         // item marked as it cannot be expanded, also top item cannot be changed
         if ((hitem._more === false) || (!hitem._parent && hitem._childs))
            return;

         if (hitem._childs && hitem._isopen) {
            hitem._isopen = false;
            if (!silent) this.updateTreeNode(hitem, d3cont);
            return;
         }

         if (hitem._obj)
            promise = doExpandItem(hitem, hitem._obj);
      }

      return promise.then(res => {
         if (res !== -1)
            return res; // done

         showProgress('Loading ' + itemname);

         return this.getObject(itemname, silent ? 'hierarchy_expand' : 'hierarchy_expand_verbose').then(res2 => {
            showProgress();
            if (res2.obj)
               return doExpandItem(res2.item, res2.obj).then(res3 => { return res3 !== -1 ? res3 : undefined; });
         });
      });
   }

   /** @summary Return main online item
     * @private */
   getTopOnlineItem(item) {
      if (item) {
         while (item && (!('_online' in item)))
            item = item._parent;
         return item;
      }

      if (!this.h)
         return null;
      if (this.h._online)
         return this.h;
      if (this.h._childs && this.h._childs[0]?._online)
         return this.h._childs[0];
      return null;
   }

   /** @summary Call function for each item which corresponds to JSON file
     * @private */
   forEachJsonFile(func) {
      if (!this.h)
         return;

      if (this.h._jsonfile)
         return func(this.h);

      this.h._childs?.forEach(item => {
         if (item._jsonfile)
            func(item);
      });
   }

   /** @summary Open JSON file
     * @param {string} filepath - URL to JSON file
     * @return {Promise} when object ready */
   async openJsonFile(filepath) {
      let isfileopened = false;
      this.forEachJsonFile(item => { if (item._jsonfile === filepath) isfileopened = true; });
      if (isfileopened) return;

      return httpRequest(filepath, 'object').then(res2 => {
         if (!res2) return;
         const h1 = { _jsonfile: filepath, _kind: getKindForType(res2._typename), _jsontmp: res2, _name: filepath.split('/').pop() };
         if (res2.fTitle) h1._title = res2.fTitle;
         h1._get = function(item /* ,itemname */) {
            if (item._jsontmp)
               return Promise.resolve(item._jsontmp);
            return httpRequest(item._jsonfile, 'object')
                         .then(res3 => {
                             item._jsontmp = res3;
                             return res3;
                          });
         };
         if (!this.h)
            this.h = h1;
         else if (this.h._kind === kTopFolder)
            this.h._childs.push(h1);
         else {
            const h0 = this.h, topname = h0?._jsonfile ? 'Files' : 'Items';
            this.h = { _name: topname, _kind: kTopFolder, _childs: [h0, h1] };
         }

         return this.refreshHtml();
      });
   }

   /** @summary Call function for each item which corresponds to ROOT file
     * @private */
   forEachRootFile(func) {
      if (!this.h)
         return;
      if ((this.h._kind === kindTFile) && this.h._file)
         return func(this.h);

      this.h._childs?.forEach(item => {
         if ((item._kind === kindTFile) && item._fullurl)
            func(item);
      });
   }

   /** @summary Find ROOT file which corresponds to provided item name
     * @private */
   findRootFileForItem(itemname) {
      let item = this.findItem(itemname);
      while (item) {
         if ((item._kind === kindTFile) && item._fullurl && item._file)
            return item;
         item = item?._parent;
      }
      return null;
   }

   /** @summary Open ROOT file
     * @param {string} filepath - URL to ROOT file, argument for openFile
     * @return {Promise} when file is opened */
   async openRootFile(filepath) {
      let isfileopened = false;
      this.forEachRootFile(item => { if (item._fullurl === filepath) isfileopened = true; });
      if (isfileopened) return;

      const msg = isStr(filepath) ? filepath : 'file';

      showProgress(`Opening ${msg} ...`);

      return openFile(filepath).then(file => {
         const h1 = this.fileHierarchy(file);
         h1._isopen = true;
         if (!this.h) {
            this.h = h1;
            if (this.#topname) h1._name = this.#topname;
         } else if (this.h._kind === kTopFolder)
            this.h._childs.push(h1);
           else {
            const h0 = this.h, topname = (h0._kind === kindTFile) ? 'Files' : 'Items';
            this.h = { _name: topname, _kind: kTopFolder, _childs: [h0, h1], _isopen: true };
         }

         return this.refreshHtml();
      }).catch(() => {
         // make CORS warning
         if (isBatchMode())
            console.error(`Fail to open ${msg} - check CORS headers`);
         else if (!d3_select('#gui_fileCORS').style('background', 'red').empty())
            setTimeout(() => d3_select('#gui_fileCORS').style('background', ''), 5000);
         return false;
      }).finally(() => showProgress());
   }

   /** @summary Create list of files for specified directory */
   async listServerDir(dirname) {
      return httpRequest(dirname, 'text').then(res => {
         if (!res) return false;
         const h = { _name: 'Files', _kind: kTopFolder, _childs: [], _isopen: true }, fmap = {};
         let p = 0;
         while (p < res.length) {
            p = res.indexOf('a href="', p+1);
            if (p < 0) break;
            p += 8;
            const p2 = res.indexOf('"', p+1);
            if (p2 < 0) break;

            const fname = res.slice(p, p2);
            p = p2 + 1;

            if (fmap[fname]) continue;
            fmap[fname] = true;

            if ((fname.lastIndexOf('.root') === fname.length - 5) && (fname.length > 5)) {
               h._childs.push({
                  _name: fname, _title: dirname + fname, _url: dirname + fname, _kind: kindTFile,
                  _click_action: kExpand, _more: true, _obj: {},
                  _expand: item => {
                     return openFile(item._url).then(file => {
                        if (!file) return false;
                        delete item._exapnd;
                        delete item._more;
                        delete item._click_action;
                        delete item._obj;
                        item._isopen = true;
                        this.fileHierarchy(file, item);
                        this.updateTreeNode(item);
                     });
                  }
               });
            } else if (((fname.lastIndexOf('.json.gz') === fname.length - 8) && (fname.length > 8)) ||
                       ((fname.lastIndexOf('.json') === fname.length - 5) && (fname.length > 5))) {
               h._childs.push({
                  _name: fname, _title: dirname + fname, _jsonfile: dirname + fname, _can_draw: true,
                  _get: item => {
                     return httpRequest(item._jsonfile, 'object').then(res2 => {
                        if (res2) {
                          item._kind = getKindForType(res2._typename);
                          item._jsontmp = res2;
                          this.updateTreeNode(item);
                        }
                        return res2;
                     });
                  }
               });
            }
         }
         if (h._childs.length)
            this.h = h;
         return true;
      });
   }

   /** @summary Apply loaded TStyle object
     * @desc One also can specify item name of JSON file name where style is loaded
     * @param {object|string} style - either TStyle object of item name where object can be load */
   async applyStyle(style) {
      if (!style)
         return true;

      let pr = Promise.resolve(style);

      if (isStr(style)) {
         const item = this.findItem({ name: style, allow_index: true, check_keys: true });
         if (item !== null)
            pr = this.getObject(item).then(res => res.obj);
         else if (style.indexOf('.json') > 0)
            pr = httpRequest(style, 'object');
      }

      return pr.then(st => {
         if (st?._typename === clTStyle)
            Object.assign(gStyle, st);
      });
   }

   /** @summary Provides information about file item
     * @private */
   getFileProp(itemname) {
      let item = this.findItem(itemname);
      if (!item)
         return null;

      itemname = item._name;
      while (item._parent) {
         item = item._parent;
         if (item._file)
            return { kind: 'file', fileurl: item._file.fURL, itemname, localfile: Boolean(item._file.fLocalFile) };

         if (item._jsonfile)
            return { kind: 'json', fileurl: item._jsonfile, itemname };

         itemname = item._name + '/' + itemname;
      }

      return null;
   }

   /** @summary Provides URL for online item
     * @desc Such URL can be used  to request data from the server
     * @return string or null if item is not online
     * @private */
   getOnlineItemUrl(item) {
      if (isStr(item))
         item = this.findItem(item);
      let prnt = item;
      while (prnt && (prnt._online === undefined))
         prnt = prnt._parent;
      return prnt ? (prnt._online + this.itemFullName(item, prnt)) : null;
   }

   /** @summary Returns true if item is online
     * @private */
   isOnlineItem(item) {
      return this.getOnlineItemUrl(item) !== null;
   }

   /** @summary Dynamic module import, supports special shortcuts from core or draw_tree
     * @return {Promise} with module
     * @private */
   async importModule(module) {
      switch (module) {
         case 'core': return import('../core.mjs');
         case 'draw_tree': return import('../draw/TTree.mjs');
         case 'hierarchy': return { HierarchyPainter, markAsStreamerInfo };
      }
      return import(/* webpackIgnore: true */ module);
   }

   /** @summary set cached object for gui drawing
     * @private */
   setCachedObject(obj) {
      this.#cached_draw_object = obj;
   }

   /** @summary method used to request object from the http server
     * @return {Promise} with requested object
     * @private */
   async getOnlineItem(item, itemname, option) {
      let url = itemname, h_get = false, req = '', req_kind = 'object', draw_handle = null;

      if (isStr(option) && (option.indexOf('hierarchy_expand') === 0)) {
         h_get = true;
         option = undefined;
      }

      if (item) {
         url = this.getOnlineItemUrl(item);
         let func = null;
         if (item._kind)
            draw_handle = getDrawHandle(item._kind);

         if (h_get) {
            req = 'h.json?compact=3';
            item._expand = onlineHierarchy; // use proper expand function
         } else if (item._make_request) {
            if (item._module) {
               const h = await this.importModule(item._module);
               func = h[item._make_request];
            } else
               func = findFunction(item._make_request);
         } else if (draw_handle?.make_request)
            func = draw_handle.make_request;


         if (isFunc(func)) {
            // ask to make request
            const dreq = func(this, item, url, option);
            // result can be simple string or object with req and kind fields
            if (dreq) {
               if (isStr(dreq))
                  req = dreq;
                else {
                  if (dreq.req) req = dreq.req;
                  if (dreq.kind) req_kind = dreq.kind;
               }
            }
         }

         if (!req && !getTypeForKind(item._kind))
           req = 'item.json.gz?compact=3';
      }

      if (!itemname && item && this.#cached_draw_object && !req) {
         // special handling for online draw when cashed
         const obj = this.#cached_draw_object;
         this.#cached_draw_object = undefined;
         return obj;
      }

      if (!req)
         req = 'root.json.gz?compact=23';

      if (url) url += '/';
      url += req;

      return new Promise(resolveFunc => {
         let itemreq = null;

         createHttpRequest(url, req_kind, obj => {
            const handleAfterRequest = func => {
               if (isFunc(func)) {
                  const res = func(this, item, obj, option, itemreq);
                  if (isObject(res)) obj = res;
               }
               resolveFunc(obj);
            };

            if (!h_get && item?._after_request) {
               if (item._module)
                  this.importModule(item._module).then(h => handleAfterRequest(h[item._after_request]));
               else
                  handleAfterRequest(findFunction(item._after_request)); // v6 support
            } else
               handleAfterRequest(draw_handle?.after_request);
         }, undefined, true).then(xhr => { itemreq = xhr; xhr.send(null); });
      });
   }

   /** @summary Access THttpServer with provided address
     * @param {string} server_address - URL to server like 'http://localhost:8090/'
     * @return {Promise} when ready */
   async openOnline(server_address) {
      const adoptHierarchy = async result => {
         this.h = result;
         if (!result)
            return Promise.resolve(null);

         if (this.h?._title && (typeof document !== 'undefined'))
            document.title = this.h._title;

         result._isopen = true;

         // mark top hierarchy as online data and
         this.h._online = server_address;

         this.h._get = (item, itemname, option) => this.getOnlineItem(item, itemname, option);

         this.h._expand = onlineHierarchy;

         const styles = [], scripts = [], v6_modules = [], v7_imports = [];
         this.forEachItem(item => {
            if (item._childs !== undefined)
               item._expand = onlineHierarchy;

            if (item._autoload) {
               const arr = item._autoload.split(';');
               arr.forEach(name => {
                  if ((name.length > 4) && (name.lastIndexOf('.mjs') === name.length - 4))
                     v7_imports.push(this.importModule(name));
                   else if ((name.length > 3) && (name.lastIndexOf('.js') === name.length - 3)) {
                     if (!scripts.find(elem => elem === name)) scripts.push(name);
                  } else if ((name.length > 4) && (name.lastIndexOf('.css') === name.length - 4)) {
                     if (!styles.find(elem => elem === name)) styles.push(name);
                  } else if (name && !v6_modules.find(elem => elem === name))
                     v6_modules.push(name);
               });
            }
         });

         return this.loadScripts(scripts, v6_modules)
               .then(() => loadScript(styles))
               .then(() => Promise.all(v7_imports))
               .then(() => {
                  this.forEachItem(item => {
                     if (!('_drawfunc' in item) || !('_kind' in item)) return;
                     const typename = getTypeForKind(item._kind) || `kind:${item._kind}`,
                           drawopt = item._drawopt;
                     if (!canDrawHandle(typename) || drawopt)
                        addDrawFunc({ name: typename, func: item._drawfunc, script: item._drawscript, opt: drawopt });
                  });

                  return this;
               });
      };

      if (!server_address) server_address = '';

      if (isObject(server_address)) {
         const h = server_address;
         server_address = '';
         return adoptHierarchy(h);
      }

      return httpRequest(server_address + 'h.json?compact=3', 'object').then(hh => adoptHierarchy(hh));
   }

   /** @summary Get properties for online item  - server name and relative name
     * @private */
   getOnlineProp(itemname) {
      let item = this.findItem(itemname);
      if (!item)
         return null;

      itemname = item._name;
      while (item._parent) {
         item = item._parent;

         if (item._online)
            return { server: item._online, itemname };
         itemname = item._name + '/' + itemname;
      }

      return null;
   }

   /** @summary Fill context menu for online item
     * @private */
   fillOnlineMenu(menu, onlineprop, itemname) {
      const node = this.findItem(itemname),
            sett = getDrawSettings(node._kind, 'nosame;noinspect'),
            handle = getDrawHandle(node._kind),
            root_type = getTypeForKind(node._kind);

      if (sett.opts && (node._can_draw !== false)) {
         sett.opts.push(kInspect);
         menu.addDrawMenu('Draw', sett.opts, arg => this.display(itemname, arg));
      }

      if (!node._childs && (node._more !== false) && (node._more || root_type || sett.expand || sett.get_expand))
         menu.add('Expand', () => this.expandItem(itemname));

      if (handle?.execute)
         menu.add('Execute', () => this.executeCommand(itemname, menu.tree_node));

      if (sett.opts && (node._can_draw !== false)) {
         menu.addDrawMenu('Draw in new window', sett.opts,
                           arg => window.open(onlineprop.server + `?nobrowser&item=${onlineprop.itemname}` +
                                              (this.isMonitoring() ? `&monitoring=${this.getMonitoringInterval()}` : '') +
                                              (arg ? `&opt=${arg}` : '')));
       }

      if (sett.opts?.length && root_type && (node._can_draw !== false)) {
         menu.addDrawMenu('Draw as png', sett.opts,
                           arg => window.open(onlineprop.server + onlineprop.itemname + '/root.png?w=600&h=400' + (arg ? '&opt=' + arg : '')),
                           'Request PNG image from the server');
      }

      if (node._player)
         menu.add('Player', () => this.player(itemname));
   }

   /** @summary Assign existing hierarchy to the painter and refresh HTML code
     * @private */
   setHierarchy(h) {
      this.h = h;
      this.refreshHtml();
   }

   /** @summary Configures monitoring interval
     * @param {number} interval - repetition interval in ms
     * @param {boolean} flag - initial monitoring state */
   setMonitoring(interval, monitor_on) {
      this.#runMonitoring('cleanup');

      if (interval) {
         interval = parseInt(interval);
         if (Number.isInteger(interval) && (interval > 0)) {
            this.#monitoring_interval = Math.max(100, interval);
            monitor_on = true;
         } else
            this.#monitoring_interval = 3000;
      }

      this.#monitoring_on = monitor_on;

      if (this.isMonitoring())
         this.#runMonitoring();
   }

   /** @summary Runs monitoring event loop
     * @private */
   #runMonitoring(arg) {
      if ((arg === 'cleanup') || !this.isMonitoring()) {
         if (this.#monitoring_handle) {
            clearTimeout(this.#monitoring_handle);
            this.#monitoring_handle = undefined;
         }

         if (this.#monitoring_frame) {
            cancelAnimationFrame(this.#monitoring_frame);
            this.#monitoring_frame = undefined;
         }
         return;
      }

      if (arg === 'frame') {
         // process of timeout, request animation frame
         this.#monitoring_handle = undefined;
         this.#monitoring_frame = requestAnimationFrame(() => this.#runMonitoring('draw'));
         return;
      }

      if (arg === 'draw') {
         this.#monitoring_frame = undefined;
         this.updateItems();
      }

      this.#monitoring_handle = setTimeout(() => this.#runMonitoring('frame'), this.getMonitoringInterval());
   }

   /** @summary Returns configured monitoring interval in ms */
   getMonitoringInterval() { return this.#monitoring_interval || 3000; }

   /** @summary Returns true when monitoring is enabled */
   isMonitoring() { return this.#monitoring_on; }

   /** @summary Assign default layout and place where drawing will be performed
     * @param {string} layout - layout like 'simple' or 'grid2x2'
     * @param {string} frameid - DOM element id where object drawing will be performed */
   setDisplay(layout, frameid) {
      if (!frameid && isObject(layout)) {
         this.disp = layout;
         this.disp_kind = 'custom';
         this.disp_frameid = null;
      } else {
         this.disp_kind = layout;
         this.disp_frameid = frameid;
      }

      if (!this.register_resize && (this.disp_kind !== 'batch')) {
         this.register_resize = true;
         registerForResize(this);
      }
   }

   /** @summary Returns configured layout */
   getLayout() {
      return this.disp_kind;
   }

   /** @summary Remove painter reference from hierarchy
     * @private */
   removePainter(obj_painter) {
      this.forEachItem(item => {
         if (item._painter === obj_painter) {
            // delete painter reference
            delete item._painter;
            // also clear data which could be associated with item
            if (isFunc(item.clear)) item.clear();
         }
      });
   }

   /** @summary Cleanup all items in hierarchy
     * @private */
   clearHierarchy(withbrowser) {
      if (this.disp) {
         this.disp.cleanup();
         delete this.disp;
      }

      const plainarr = [];

      this.forEachItem(item => {
         delete item._painter; // remove reference on the painter
         // when only display cleared, try to clear all browser items
         if (!withbrowser && isFunc(item.clear)) item.clear();
         if (withbrowser) plainarr.push(item);
      });

      if (withbrowser) {
         // cleanup all monitoring loops
         this.enableMonitoring(false);
         // simplify work for javascript and delete all (ok, most of) cross-references
         this.selectDom().html('');
         plainarr.forEach(d => { delete d._parent; delete d._childs; delete d._obj; delete d._d3cont; });
         delete this.h;
      }
   }

   /** @summary Returns actual MDI display object
     * @desc It should an instance of {@link MDIDisplay} class */
   getDisplay() {
      return this.disp;
   }

   /** @summary method called when MDI element is cleaned up
     * @desc hook to perform extra actions when frame is cleaned
     * @private */
   cleanupFrame(frame) {
      d3_select(frame).attr('frame_title', null);

      this.clearDrop(frame);

      const lst = cleanup(frame);

      // we remove all painters references from items
      if (lst.length) {
         this.forEachItem(item => {
            if (item._painter && lst.indexOf(item._painter) >= 0)
               delete item._painter;
         });
      }
   }

   /** @summary Creates configured MDIDisplay object
     * @return {Promise} when ready
     * @private */
   async createDisplay() {
      if (this.disp) {
         if ((this.disp.numDraw() > 0) || (this.disp_kind === 'custom'))
            return this.disp;
         this.disp.cleanup();
         delete this.disp;
      }

      if (this.disp_kind === 'batch') {
         const pr = isNodeJs() ? _loadJSDOM() : Promise.resolve(null);
         return pr.then(handle => {
            this.disp = new BatchDisplay(1200, 800, handle?.body);
            return this.disp;
         });
      }

      // check that we can found frame where drawing should be done
      if (!document.getElementById(this.disp_frameid))
         return null;

      if (isBatchMode())
         this.disp = new BatchDisplay(settings.CanvasWidth, settings.CanvasHeight);
      else if ((this.disp_kind.indexOf('flex') === 0) || (this.disp_kind.indexOf('coll') === 0))
         this.disp = new FlexibleDisplay(this.disp_frameid);
      else if (this.disp_kind === 'tabs')
         this.disp = new TabsDisplay(this.disp_frameid);
      else
         this.disp = new GridDisplay(this.disp_frameid, this.disp_kind);

      this.disp.cleanupFrame = this.cleanupFrame.bind(this);
      if (settings.DragAndDrop)
         this.disp.setInitFrame(this.enableDrop.bind(this));

      return this.disp;
   }

   /** @summary If possible, creates custom MDIDisplay for given item
     * @param itemname - name of item, for which drawing is created
     * @param custom_kind - display kind
     * @return {Promise} with mdi object created
     * @private */
   async createCustomDisplay(itemname, custom_kind) {
      if (this.disp_kind !== 'simple')
         return this.createDisplay();

      this.disp_kind = custom_kind;

      // check if display can be erased
      if (this.disp) {
         const num = this.disp.numDraw();
         if ((num > 1) || ((num === 1) && !this.disp.findFrame(itemname)))
            return this.createDisplay();
         this.disp.cleanup();
         delete this.disp;
      }

      return this.createDisplay();
   }

   /** @summary function updates object drawings for other painters
     * @private */
   updateOnOtherFrames(painter, obj) {
      const handle = obj._typename ? getDrawHandle(getKindForType(obj._typename)) : null;
      if (handle?.draw_field && obj[handle?.draw_field])
         obj = obj[handle?.draw_field];

      let isany = false;
      this.disp?.forEachPainter((p /* , frame */) => {
         if ((p === painter) || (p.getItemName() !== painter.getItemName())) return;

         // do not activate frame when doing update
         // mdi.activateFrame(frame);
         if (isFunc(p.redrawObject) && p.redrawObject(obj))
            isany = true;
      });
      return isany;
   }

   /** @summary Process resize event
     * @private */
   checkResize(size) {
      this.disp?.checkMDIResize(null, size);
   }

   /** @summary Load and execute scripts, kept to support v6 applications
     * @private */
   async loadScripts(scripts, modules, use_inject) {
      if (!scripts?.length && !modules?.length)
         return true;

      if (use_inject && scripts.indexOf('.mjs') > 0)
         return loadModules(scripts.split(';'));

      if (use_inject && !globalThis.JSROOT) {
         globalThis.JSROOT = {
            version, gStyle, create, httpRequest, loadScript, decodeUrl,
            source_dir, settings, addUserStreamer, addDrawFunc,
            draw, redraw
         };
      }

      if (internals.ignore_v6 || use_inject)
         return loadScript(scripts);

      return _ensureJSROOT().then(v6 => {
         return v6.require(modules)
                  .then(() => loadScript(scripts))
                  .then(() => v6._complete_loading());
      });
   }

   /** @summary Start GUI
     * @return {Promise} when ready
     * @private */
   async startGUI(gui_div, url) {
      const d = decodeUrl(url),

      getOption = opt => {
         let res = d.get(opt, null);
         if ((res === null) && gui_div && !gui_div.empty() && gui_div.node().hasAttribute(opt))
            res = gui_div.attr(opt);
         return res;
      },

      getUrlOptionAsArray = opt => {
         let res = [];

         while (opt) {
            const separ = opt.indexOf(';');
            let part = (separ > 0) ? opt.slice(0, separ) : opt;

            opt = (separ > 0) ? opt.slice(separ+1) : '';

            let canarray = true;
            if (part[0] === '#') { part = part.slice(1); canarray = false; }

            const val = d.get(part, null);

            if (canarray)
               res = res.concat(parseAsArray(val));
            else if (val !== null)
               res.push(val);
         }
         return res;
      },

      getOptionAsArray = opt => {
         let res = getUrlOptionAsArray(opt);
         if (res.length || !gui_div || gui_div.empty())
            return res;
         while (opt) {
            const separ = opt.indexOf(';');
            let part = separ > 0 ? opt.slice(0, separ) : opt;
            opt = separ > 0 ? opt.slice(separ+1) : '';

            let canarray = true;
            if (part[0] === '#') {
               part = part.slice(1);
               canarray = false;
            }
            if (part === 'files' || !gui_div.node().hasAttribute(part))
               continue;

            const val = gui_div.attr(part);

            if (canarray)
               res = res.concat(parseAsArray(val));
            else if (val !== null)
               res.push(val);
         }
         return res;
      },

      filesdir = d.get('path') || '', // path used in normal gui
      jsonarr = getOptionAsArray('#json;jsons'),
      expanditems = getOptionAsArray('expand'),
      focusitem = getOption('focus'),
      layout = getOption('layout'),
      style = getOptionAsArray('#style'),
      title = getOption('title');

      this.#one_by_one = settings.drop_items_one_by_one ?? (getOption('one_by_one') !== null);

      let prereq = getOption('prereq') || '',
          load = getOption('load'),
          dir = getOption('dir'),
          inject = getOption('inject'),
          filesarr = getOptionAsArray('#file;files'),
          itemsarr = getOptionAsArray('#item;items'),
          optionsarr = getOptionAsArray('#opt;opts'),
          monitor = getOption('monitoring'),
          statush = 0, status = getOption('status'),
          browser_kind = getOption('browser'),
          browser_configured = Boolean(browser_kind);

      if (monitor === null)
         monitor = 0;
      else if (monitor === '')
         monitor = 3000;
      else
         monitor = parseInt(monitor);

      if (getOption('float') !== null) {
         browser_kind = 'float';
         browser_configured = true;
      } else if (getOption('fix') !== null) {
         browser_kind = 'fix';
         browser_configured = true;
      }

      if (!browser_configured && (browser.screenWidth <= 640))
         browser_kind = 'float';

      this.no_select = getOption('noselect');

      if (getOption('files_monitoring') !== null)
         this.files_monitoring = true;

      if (title && (typeof document !== 'undefined'))
         document.title = title;

      if (!expanditems.length && (getOption('expand') === ''))
         expanditems.push('');

      if (filesdir) {
         for (let i = 0; i < filesarr.length; ++i)
            filesarr[i] = filesdir + filesarr[i];
         for (let i = 0; i < jsonarr.length; ++i)
            jsonarr[i] = filesdir + jsonarr[i];
      }

      if (!itemsarr.length && ((getOption('item') === '') || (jsonarr.length === 1 && !expanditems.length)))
         itemsarr.push('');

      if (!this.disp_kind) {
         if (isStr(layout) && layout)
            this.disp_kind = layout;
         else if (settings.DislpayKind && settings.DislpayKind !== 'simple')
            this.disp_kind = settings.DislpayKind;
         else {
            const _kinds = ['simple', 'simple', 'vert2', 'vert21', 'vert22', 'vert32',
                             'vert222', 'vert322', 'vert332', 'vert333'];
            this.disp_kind = _kinds[itemsarr.length] || 'flex';
         }
      }

      if (status === 'no')
         status = null;
      else if (status === 'off') {
         this.status_disabled = true;
         status = null;
      } else if (status === 'on')
         status = true;
      else if (status !== null) {
         statush = parseInt(status);
         if (!Number.isInteger(statush) || (statush < 5)) statush = 0;
         status = true;
      }
      if (this.no_select === '') this.no_select = true;

      if (!browser_kind)
         browser_kind = 'fix';
      else if (browser_kind === 'no')
         browser_kind = '';
      else if (browser_kind === 'off') {
         browser_kind = '';
         status = null;
         this.exclude_browser = true;
      }
      if (getOption('nofloat') !== null)
         this.float_browser_disabled = true;

      if (this.start_without_browser)
         browser_kind = '';

      this.#topname = getOption('topname');

      const openAllFiles = () => {
         let promise;

         if (load || prereq) {
            promise = this.loadScripts(load, prereq); load = ''; prereq = '';
         } else if (inject) {
            promise = this.loadScripts(inject, '', true); inject = '';
         } else if (browser_kind) {
            promise = this.createBrowser(browser_kind); browser_kind = '';
         } else if (status !== null) {
            promise = this.createStatusLine(statush, status); status = null;
         } else if (jsonarr.length)
            promise = this.openJsonFile(jsonarr.shift());
         else if (filesarr.length)
            promise = this.openRootFile(filesarr.shift());
         else if (dir) {
            promise = this.listServerDir(dir); dir = '';
         } else if (expanditems.length)
            promise = this.expandItem(expanditems.shift());
         else if (style.length)
            promise = this.applyStyle(style.shift());
         else {
            return this.refreshHtml()
                   .then(() => this.displayItems(itemsarr, optionsarr))
                   .then(() => focusitem ? this.focusOnItem(focusitem) : this)
                   .then(() => {
                      this.setMonitoring(monitor);
                      return itemsarr ? this.refreshHtml() : this; // this is final return
                   });
         }

         return promise.then(openAllFiles);
      };

      let h0 = null;
      if (this.is_online) {
         const func = internals.getCachedHierarchy || findFunction('GetCachedHierarchy');
         if (isFunc(func))
            h0 = func();
         if (!isObject(h0))
            h0 = '';

         if ((this.is_online === 'draw') && !itemsarr.length)
            itemsarr.push('');
      }

      if (h0 !== null) {
         return this.openOnline(h0).then(() => {
            // check if server enables monitoring
            if (!this.exclude_browser && !browser_configured && this.h._browser) {
               browser_kind = this.h._browser;
               if (browser_kind === 'no')
                  browser_kind = '';
               else if (browser_kind === 'off') {
                  browser_kind = '';
                  status = null;
                  this.exclude_browser = true;
               }
            }

            if (('_monitoring' in this.h) && !monitor)
               monitor = this.h._monitoring;

            if (this.h._loadfile && !filesarr.length)
               filesarr = parseAsArray(this.h._loadfile);

            if (('_drawitem' in this.h) && !itemsarr.length) {
               itemsarr = parseAsArray(this.h._drawitem);
               optionsarr = parseAsArray(this.h._drawopt);
            }

            if (this.h._layout && !layout && ((this.is_online !== 'draw') || (itemsarr.length > 1)))
               this.disp_kind = this.h._layout;

            if (('_toptitle' in this.h) && this.exclude_browser && (typeof document !== 'undefined'))
               document.title = this.h._toptitle;

            if (gui_div)
               this.prepareGuiDiv(gui_div.attr('id'), this.disp_kind);

            return openAllFiles();
         });
      }

      if (gui_div)
         this.prepareGuiDiv(gui_div.attr('id'), this.disp_kind);

      return openAllFiles();
   }

   /** @summary Prepare div element - create layout and buttons
     * @private */
   prepareGuiDiv(myDiv, layout) {
      this.gui_div = isStr(myDiv) ? myDiv : myDiv.attr('id');

      this.brlayout = new BrowserLayout(this.gui_div, this);

      this.brlayout.create(!this.exclude_browser);

      this.createButtons();

      this.setDisplay(layout, this.brlayout.drawing_divid());
   }

   /** @summary Create shortcut buttons */
   createButtons() {
      if (this.exclude_browser) return;

      const btns = this.brlayout?.createBrowserBtns();
      if (!btns) return;

      ToolbarIcons.createSVG(btns, ToolbarIcons.diamand, 15, 'toggle fix-pos browser', 'browser')
                  .style('margin', '3px').on('click', () => this.createBrowser('fix', true));

      if (!this.float_browser_disabled) {
         ToolbarIcons.createSVG(btns, ToolbarIcons.circle, 15, 'toggle float browser', 'browser')
                     .style('margin', '3px').on('click', () => this.createBrowser('float', true));
      }

      if (!this.status_disabled) {
         ToolbarIcons.createSVG(btns, ToolbarIcons.three_circles, 15, 'toggle status line', 'browser')
                     .style('margin', '3px').on('click', () => this.createStatusLine(0, 'toggle'));
      }
   }

   /** @summary Returns true if status is exists */
   hasStatusLine() {
      if (this.status_disabled || !this.gui_div || !this.brlayout)
         return false;
      return this.brlayout.hasStatus();
   }

   /** @summary Create status line
     * @param {number} [height] - size of the status line
     * @param [mode] - false / true / 'toggle'
     * @return {Promise} when ready */
   async createStatusLine(height, mode) {
      if (this.status_disabled || !this.gui_div || !this.brlayout)
         return '';
      return this.brlayout.createStatusLine(height, mode);
   }

   /** @summary Redraw hierarchy
     * @desc works only when inspector or streamer info is displayed
     * @private */
   redrawObject(obj) {
      if (!this._inspector && !this._streamer_info)
         return false;
      if (this._streamer_info)
         this.h = createStreamerInfoContent(obj);
      else
         this.h = createInspectorContent(obj);
      return this.refreshHtml().then(() => this.setTopPainter());
   }

   /** @summary Create browser elements
     * @return {Promise} when completed */
   async createBrowser(browser_kind, update_html) {
      if (!this.gui_div || this.exclude_browser || !this.brlayout)
         return false;

      const main = d3_select(`#${this.gui_div} .jsroot_browser`);
      // one requires top-level container
      if (main.empty())
         return false;

      if ((browser_kind === 'float') && this.float_browser_disabled)
         browser_kind = 'fix';

      if (!main.select('.jsroot_browser_area').empty()) {
         // this is case when browser created,
         // if update_html specified, hidden state will be toggled

         if (update_html) this.brlayout.toggleKind(browser_kind);

         return true;
      }

      let guiCode = `<p class="jsroot_browser_version"><a href="https://root.cern/js/">JSROOT</a> version <span style="color:green"><b>${version}</b></span></p>`;

      if (this.is_online) {
         guiCode += '<p> Hierarchy in <a href="h.json">json</a> and <a href="h.xml">xml</a> format</p>' +
                    '<div style="display:inline; vertical-align:middle; white-space: nowrap;">' +
                    '<label style="margin-right:5px"><input type="checkbox" name="monitoring" class="gui_monitoring"/>Monitoring</label>';
      } else if (!this.no_select) {
         const myDiv = d3_select('#'+this.gui_div),
               files = myDiv.attr('files') || '../files/hsimple.root',
               path = decodeUrl().get('path') || myDiv.attr('path') || '',
               arrFiles = files.split(';');

         guiCode += '<input type="text" value="" style="width:95%; margin:5px;border:2px;" class="gui_urlToLoad" title="input file name"/>' +
                    '<div style="display:flex;flex-direction:row;padding-top:5px">' +
                    '<select class="gui_selectFileName" style="flex:1;padding:2px;" title="select file name"' +
                    '<option value="" selected="selected"></option>';
         arrFiles.forEach(fname => { guiCode += `<option value="${path + fname}">${fname}</option>`; });
         guiCode += '</select>' +
                    '<input type="file" class="gui_localFile" accept=".root" style="display:none"/><output id="list" style="display:none"></output>' +
                    '<input type="button" value="..." class="gui_fileBtn" style="min-width:3em;padding:3px;margin-left:5px;margin-right:5px;" title="select local file for reading"/><br/>' +
                    '</div>' +
                    '<p id="gui_fileCORS"><small><a href="https://github.com/root-project/jsroot/blob/master/docs/JSROOT.md#reading-root-files-from-other-servers">Read docu</a>' +
                    ' how to open files from other servers.</small></p>' +
                    '<div style="display:flex;flex-direction:row">' +
                    '<input style="padding:3px;margin-right:5px" class="gui_ReadFileBtn" type="button" title="Read the Selected File" value="Load"/>' +
                    '<input style="padding:3px;margin-right:5px" class="gui_ResetUIBtn" type="button" title="Close all opened files and clear drawings" value="Reset"/>';
      } else if (this.no_select === 'file')
         guiCode += '<div style="display:flex;flex-direction:row">';


      if (this.is_online || !this.no_select || this.no_select === 'file') {
         guiCode += '<select style="padding:2px;margin-right:5px;" title="layout kind" class="gui_layout"></select>' +
                    '</div>';
      }

      guiCode += `<div id="${this.gui_div}_browser_hierarchy" class="jsroot_browser_hierarchy"></div>`;

      this.brlayout.setBrowserContent(guiCode);

      const title_elem = this.brlayout.setBrowserTitle(this.is_online ? 'ROOT online server' : 'Read a ROOT file');
      title_elem?.on('contextmenu', evnt => {
         evnt.preventDefault();
         createMenu(evnt).then(menu => {
            this.fillSettingsMenu(menu, true);
            menu.show();
         });
      }).on('dblclick', () => {
         this.createBrowser(this.brlayout?.browser_kind === 'float' ? 'fix' : 'float', true);
      });

      if (!this.is_online && !this.no_select) {
         this.readSelectedFile = function() {
            const filename = main.select('.gui_urlToLoad').property('value').trim();
            if (!filename) return;

            if (filename.toLowerCase().lastIndexOf('.json') === filename.length - 5)
               this.openJsonFile(filename);
            else
               this.openRootFile(filename);
         };

         main.select('.gui_selectFileName').property('value', '')
              .on('change', evnt => main.select('.gui_urlToLoad').property('value', evnt.target.value));
         main.select('.gui_fileBtn').on('click', () => main.select('.gui_localFile').node().click());

         main.select('.gui_ReadFileBtn').on('click', () => this.readSelectedFile());

         main.select('.gui_ResetUIBtn').on('click', () => this.clearHierarchy(true));

         main.select('.gui_urlToLoad').on('keyup', evnt => {
            if (evnt.code === 'Enter') this.readSelectedFile();
         });

         main.select('.gui_localFile').on('change', evnt => {
            const files = evnt.target.files;

            for (let n = 0; n < files.length; ++n) {
               const f = files[n];
               main.select('.gui_urlToLoad').property('value', f.name);
               this.openRootFile(f);
            }
         });
      }

      const layout = main.select('.gui_layout');
      if (!layout.empty()) {
         ['simple', 'vert2', 'vert3', 'vert231', 'horiz2', 'horiz32', 'flex', 'tabs',
          'grid 2x2', 'grid 1x3', 'grid 2x3', 'grid 3x3', 'grid 4x4'].forEach(kind => layout.append('option').attr('value', kind).html(kind));

         layout.on('change', ev => {
            const kind = ev.target.value || 'flex';
            this.setDisplay(kind, this.gui_div + '_drawing');
            settings.DislpayKind = kind;
         });
      }

      this.setDom(this.gui_div + '_browser_hierarchy');

      if (update_html) {
         this.refreshHtml();
         this.initializeBrowser();
      }

      return this.brlayout.toggleBrowserKind(browser_kind || 'fix');
   }

   /** @summary Initialize browser elements */
   initializeBrowser() {
      const main = d3_select(`#${this.gui_div} .jsroot_browser`);
      if (main.empty() || !this.brlayout) return;

      this.brlayout.adjustBrowserSize();

      const selects = main.select('.gui_layout').node();

      if (selects) {
         let found = false;
         for (const i in selects.options) {
            const s = selects.options[i].text;
            if (!isStr(s)) continue;
            if ((s === this.getLayout()) || (s.replace(/ /g, '') === this.getLayout())) {
               selects.selectedIndex = i; found = true;
               break;
            }
         }
         if (!found) {
            const opt = document.createElement('option');
            opt.innerHTML = opt.value = this.getLayout();
            selects.appendChild(opt);
            selects.selectedIndex = selects.options.length - 1;
         }
      }

      if (this.is_online) {
         if (this.h?._toptitle)
            this.brlayout.setBrowserTitle(this.h._toptitle);
         main.select('.gui_monitoring')
           .property('checked', this.isMonitoring())
           .on('click', evnt => {
               this.enableMonitoring(evnt.target.checked);
               this.updateItems();
            });
      } else if (!this.no_select) {
         let fname = '';
         this.forEachRootFile(item => { if (!fname) fname = item._fullurl; });
         main.select('.gui_urlToLoad').property('value', fname);
      }
   }

   /** @summary Enable monitoring mode */
   enableMonitoring(on) {
      this.setMonitoring(undefined, on);

      const chkbox = d3_select(`#${this.gui_div} .jsroot_browser .gui_monitoring`);
      if (!chkbox.empty() && (chkbox.property('checked') !== on))
         chkbox.property('checked', on);
   }

} // class HierarchyPainter

// ======================================================================================


/** @summary Display streamer info
  * @private */
async function drawStreamerInfo(dom, lst) {
   const painter = new HierarchyPainter('sinfo', dom, '__as_dark_mode__');

   // in batch mode HTML drawing is not possible, just keep object reference for a minute
   if (isBatchMode()) {
      painter.selectDom().property('_json_object_', lst);
      return painter;
   }

   painter._streamer_info = true;
   painter.h = createStreamerInfoContent(lst);

   // painter.selectDom().style('overflow','auto');

   return painter.refreshHtml().then(() => {
      painter.setTopPainter();
      return painter;
   });
}

/** @summary Display inspector
  * @private */
async function drawInspector(dom, obj, opt) {
   cleanup(dom);
   const painter = new HierarchyPainter('inspector', dom, '__as_dark_mode__');

   // in batch mode HTML drawing is not possible, just keep object reference for a minute
   if (isBatchMode()) {
      painter.selectDom().property('_json_object_', obj);
      return painter;
   }

   painter.default_by_click = kExpand; // default action
   painter.with_icons = false;
   painter._inspector = true; // keep
   let expand_level = 0;

   if (isStr(opt) && opt.indexOf(kInspect) === 0) {
      opt = opt.slice(kInspect.length);
      if (opt)
         expand_level = Number.parseInt(opt);
   }

   if (painter.selectDom().classed('jsroot_inspector')) {
      painter.removeInspector = function() {
         this.selectDom().remove();
      };

      if (!browser.qt6 && !browser.cef3) {
         painter.storeAsJson = function() {
            const json = toJSON(obj, 2),
                  fname = obj.fName || 'file';
            saveFile(`${fname}.json`, prJSON + encodeURIComponent(json));
         };
      }
   }

   painter.fill_context = function(menu, hitem) {
      const sett = getDrawSettings(hitem._kind, 'nosame');
      if (sett.opts) {
         menu.addDrawMenu('nosub:Draw', sett.opts, arg => {
            if (!hitem?._obj) return;
            const obj2 = hitem._obj;
            let ddom = this.selectDom().node();
            if (isFunc(this.removeInspector)) {
               ddom = ddom.parentNode;
               this.removeInspector();
               if (arg.indexOf(kInspect) === 0)
                  return this.showInspector(arg, obj2);
            }
            cleanup(ddom);
            draw(ddom, obj2, arg);
         });
      }
   };

   painter.h = createInspectorContent(obj);

   return painter.refreshHtml().then(() => {
      painter.setTopPainter();
      return painter.exapndToLevel(expand_level);
   });
}


/** @summary Show object in inspector for provided object
  * @protected */
ObjectPainter.prototype.showInspector = function(opt, obj) {
   if (opt === 'check')
      return true;

   const main = this.selectDom(),
         rect = getElementRect(main),
         w = Math.round(rect.width * 0.05) + 'px',
         h = Math.round(rect.height * 0.05) + 'px',
         id = 'root_inspector_' + internals.id_counter++;

   main.append('div')
       .attr('id', id)
       .attr('class', 'jsroot_inspector')
       .style('position', 'absolute')
       .style('top', h)
       .style('bottom', h)
       .style('left', w)
       .style('right', w);

   if (!obj?._typename)
      obj = isFunc(this.getPrimaryObject) ? this.getPrimaryObject() : this.getObject();

   return drawInspector(id, obj, opt);
};


internals.drawInspector = drawInspector;

export { HierarchyPainter, drawInspector, drawStreamerInfo, drawList, markAsStreamerInfo,
         folderHierarchy, taskHierarchy, listHierarchy, objectHierarchy, keysHierarchy };
