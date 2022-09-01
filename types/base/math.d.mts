/** @summary gamma calculation
  * @memberof Math */
export function gamma(x: any): any;
/** @summary Polynomialeval function
  * @desc calculates a value of a polynomial of the form:
  * a[0]x^N+a[1]x^(N-1) + ... + a[N]
  * @memberof Math */
export function Polynomialeval(x: any, a: any, N: any): any;
/** @summary Polynomial1eval function
  * @desc calculates a value of a polynomial of the form:
  * x^N+a[0]x^(N-1) + ... + a[N-1]
  * @memberof Math */
export function Polynomial1eval(x: any, a: any, N: any): any;
/** @summary Stirling formula for the gamma function
  * @memberof Math */
export function stirf(x: any): number;
/** @summary gamma_pdf function
  * @memberof Math */
export function gamma_pdf(x: any, alpha: any, theta: any, x0?: number): number;
/** @summary ndtri function
  * @memberof Math */
export function ndtri(y0: any): number;
/** @summary normal_quantile function
  * @memberof Math */
export function normal_quantile(z: any, sigma: any): number;
/** @summary normal_quantile_c function
  * @memberof Math */
export function normal_quantile_c(z: any, sigma: any): number;
/** @summary lognormal_cdf_c function
  * @memberof Math */
export function lognormal_cdf_c(x: any, m: any, s: any, x0: any): number;
/** @summary lognormal_cdf_c function
  * @memberof Math */
export function lognormal_cdf(x: any, m: any, s: any, x0?: number): number;
/** @summary igami function
  * @memberof Math */
export function igami(a: any, y0: any): number;
/** @summary igamc function
  * @memberof Math */
export function igamc(a: any, x: any): any;
/** @summary igam function
  * @memberof Math */
export function igam(a: any, x: any): any;
/** @summary lgam function, logarithm from gamma
  * @memberof Math */
export function lgam(x: any): any;
/** @summary lgamma
  * @memberof Math */
export function lgamma(z: any): any;
/** @summary complementary error function
  * @memberof Math */
export function erfc(a: any): any;
/** @summary error function
  * @memberof Math */
export function erf(x: any): any;
/** @summary Probability density function of the beta distribution.
  * @memberof Math */
export function beta_pdf(x: any, a: any, b: any): any;
/** @summary Calculates the normalized (regularized) incomplete beta function.
  * @memberof Math */
export function inc_beta(x: any, a: any, b: any): number;
/** @summary Calculates the normalized (regularized) incomplete beta function.
  * @memberof Math */
export function BetaIncomplete(x: any, a: any, b: any): number;
/** @summary ROOT::Math::Cephes::pseries
  * @memberof Math */
export function pseries(a: any, b: any, x: any): number;
/** @summary ROOT::Math::Cephes::incbet
  * @memberof Math */
export function incbet(aa: any, bb: any, xx: any): number;
/** @summary copy of ROOT::Math::Cephes::incbi
  * @memberof Math */
export function incbi(aa: any, bb: any, yy0: any): any;
/** @summary ROOT::Math::beta_quantile
  * @memberof Math */
export function beta_quantile(z: any, a: any, b: any): any;
/** @summary chisquared_cdf_c
  * @memberof Math */
export function chisquared_cdf_c(x: any, r: any, x0: any): any;
/** @summary beta
  * @memberof Math */
export function beta(x: any, y: any): number;
/** @summary inc_gamma
  * @memberof Math */
export function inc_gamma(a: any, x: any): any;
/** @summary inc_gamma_c
  * @memberof Math */
export function inc_gamma_c(a: any, x: any): any;
/** @summary landau_pdf function
  * @desc LANDAU pdf : algorithm from CERNLIB G110 denlan
  *  same algorithm is used in GSL
  * @memberof Math */
export function landau_pdf(x: any, xi: any, x0: any): number;
/** @summary Complement of the cumulative distribution function of the beta distribution.
  * @memberof Math */
export function beta_cdf_c(x: any, a: any, b: any): number;
/** @summary Landau function
  * @memberof Math */
export function Landau(x: any, mpv: any, sigma: any, norm: any): number;
/** @summary Probability density function of the F-distribution.
  * @memberof Math */
export function fdistribution_pdf(x: any, n: any, m: any, x0?: number): number;
/** @summary fdistribution_cdf function
  * @memberof Math */
export function fdistribution_cdf(x: any, n: any, m: any, x0?: number): any;
/** @summary fdistribution_cdf_c function
  * @memberof Math */
export function fdistribution_cdf_c(x: any, n: any, m: any, x0?: number): any;
/** @summary normal_cdf_c function
  * @memberof Math */
export function normal_cdf_c(x: any, sigma: any, x0?: number): number;
/** @summary normal_cdf function
  * @memberof Math */
export function normal_cdf(x: any, sigma: any, x0?: number): any;
/** @summary log normal pdf
  * @memberof Math */
export function lognormal_pdf(x: any, m: any, s: any, x0?: number): number;
/** @summary normal pdf
  * @memberof Math */
export function normal_pdf(x: any, sigma?: number, x0?: number): number;
/** @summary Crystal ball function
  * @memberof Math */
export function crystalball_function(x: any, alpha: any, n: any, sigma: any, mean?: number): number;
/** @summary pdf definition of the crystal_ball which is defined only for n > 1 otherwise integral is diverging
  * @memberof Math */
export function crystalball_pdf(x: any, alpha: any, n: any, sigma: any, mean?: number): number;
/** @summary crystalball_cdf function
  * @memberof Math */
export function crystalball_cdf(x: any, alpha: any, n: any, sigma: any, mean?: number): number;
/** @summary crystalball_cdf_c function
  * @memberof Math */
export function crystalball_cdf_c(x: any, alpha: any, n: any, sigma: any, mean?: number): number;
/** @summary chisquared_cdf
  * @memberof Math */
export function chisquared_cdf(x: any, r: any, x0?: number): any;
/** @summary gamma_quantile_c function
  * @memberof Math */
export function gamma_quantile_c(z: any, alpha: any, theta: any): number;
/** @summary gamma_quantile function
  * @memberof Math */
export function gamma_quantile(z: any, alpha: any, theta: any): number;
/** @summary breitwigner_cdf_c function
  * @memberof Math */
export function breitwigner_cdf_c(x: any, gamma: any, x0?: number): number;
/** @summary breitwigner_cdf function
  * @memberof Math */
export function breitwigner_cdf(x: any, gamma: any, x0?: number): number;
/** @summary cauchy_cdf_c function
  * @memberof Math */
export function cauchy_cdf_c(x: any, b: any, x0?: number): number;
/** @summary cauchy_cdf function
  * @memberof Math */
export function cauchy_cdf(x: any, b: any, x0?: number): number;
/** @summary cauchy_pdf function
  * @memberof Math */
export function cauchy_pdf(x: any, b?: number, x0?: number): number;
/** @summary gaussian_pdf function
  * @memberof Math */
export function gaussian_pdf(x: any, sigma?: number, x0?: number): number;
/** @summary tdistribution_cdf_c function
  * @memberof Math */
export function tdistribution_cdf_c(x: any, r: any, x0?: number): number;
/** @summary tdistribution_cdf function
  * @memberof Math */
export function tdistribution_cdf(x: any, r: any, x0?: number): number;
/** @summary tdistribution_pdf function
  * @memberof Math */
export function tdistribution_pdf(x: any, r: any, x0?: number): number;
/** @summary exponential_cdf_c function
  * @memberof Math */
export function exponential_cdf_c(x: any, lambda: any, x0?: number): number;
/** @summary exponential_cdf function
  * @memberof Math */
export function exponential_cdf(x: any, lambda: any, x0?: number): number;
/** @summary chisquared_pdf
  * @memberof Math */
export function chisquared_pdf(x: any, r: any, x0: any): number;
/** @summary Calculates Beta-function Gamma(p)*Gamma(q)/Gamma(p+q).
  * @memberof Math */
export function Beta(x: any, y: any): number;
/** @summary GammaDist function
  * @memberof Math */
export function GammaDist(x: any, gamma: any, mu?: number, beta?: number): number;
/** @summary probability density function of Laplace distribution
  * @memberof Math */
export function LaplaceDist(x: any, alpha?: number, beta?: number): number;
/** @summary distribution function of Laplace distribution
  * @memberof Math */
export function LaplaceDistI(x: any, alpha?: number, beta?: number): number;
/** @summary LogNormal function
  * @memberof Math */
export function LogNormal(x: any, sigma: any, theta?: number, m?: number): number;
/** @summary density function for Student's t- distribution
  * @memberof Math */
export function Student(T: any, ndf: any): number;
/** @summary cumulative distribution function of Student's
  * @memberof Math */
export function StudentI(T: any, ndf: any): number;
/** @summary gaus function for TFormula
  * @memberof Math */
export function gaus(f: any, x: any, i: any): number;
/** @summary gausn function for TFormula
  * @memberof Math */
export function gausn(f: any, x: any, i: any): number;
/** @summary gausxy function for TFormula
  * @memberof Math */
export function gausxy(f: any, x: any, y: any, i: any): number;
/** @summary expo function for TFormula
  * @memberof Math */
export function expo(f: any, x: any, i: any): number;
/** @summary Prob function
  * @memberof Math */
export function Prob(chi2: any, ndf: any): any;
/** @summary Gaus function
  * @memberof Math */
export function Gaus(x: any, mean: any, sigma: any): number;
/** @summary BreitWigner function
  * @memberof Math */
export function BreitWigner(x: any, mean: any, gamma: any): number;
/** @summary Computes the probability density function of the Beta distribution
  * @memberof Math */
export function BetaDist(x: any, p: any, q: any): number;
/** @summary Computes the distribution function of the Beta distribution.
  * @memberof Math */
export function BetaDistI(x: any, p: any, q: any): number;
/** @summary landau function for TFormula
  * @memberof Math */
export function landau(f: any, x: any, i: any): number;
/** @summary landaun function for TFormula
  * @memberof Math */
export function landaun(f: any, x: any, i: any): number;
/** @summary ChebyshevN function
  * @memberof Math */
export function ChebyshevN(n: any, x: any, c: any): any;
/** @summary Chebyshev1 function
  * @memberof Math */
export function Chebyshev1(x: any, c0: any, c1: any): any;
/** @summary Chebyshev2 function
  * @memberof Math */
export function Chebyshev2(x: any, c0: any, c1: any, c2: any): any;
/** @summary Chebyshev3 function
  * @memberof Math */
export function Chebyshev3(x: any, ...args: any[]): any;
/** @summary Chebyshev4 function
  * @memberof Math */
export function Chebyshev4(x: any, ...args: any[]): any;
/** @summary Chebyshev5 function
  * @memberof Math */
export function Chebyshev5(x: any, ...args: any[]): any;
/** @summary Chebyshev6 function
  * @memberof Math */
export function Chebyshev6(x: any, ...args: any[]): any;
/** @summary Chebyshev7 function
  * @memberof Math */
export function Chebyshev7(x: any, ...args: any[]): any;
/** @summary Chebyshev8 function
  * @memberof Math */
export function Chebyshev8(x: any, ...args: any[]): any;
/** @summary Chebyshev9 function
  * @memberof Math */
export function Chebyshev9(x: any, ...args: any[]): any;
/** @summary Chebyshev10 function
  * @memberof Math */
export function Chebyshev10(x: any, ...args: any[]): any;
/** @summary Return function to calculate boundary of TEfficiency
  * @memberof Math */
export function getTEfficiencyBoundaryFunc(option: any, isbayessian: any): typeof eff_Bayesian;
/** @summary for a central confidence interval for a Beta distribution
  * @memberof Math */
declare function eff_Bayesian(total: any, passed: any, level: any, bUpper: any, alpha: any, beta: any): any;
export { gamma as tgamma, gamma as Gamma, fdistribution_pdf as FDist, fdistribution_cdf as FDistI, normal_cdf_c as gaussian_cdf_c, normal_cdf as gaussian_cdf };
