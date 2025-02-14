#import "/templates/latex.typ": *

#show: article

#maketitle(
  title: "PEU 405 Assignment 1",
  authors: (
    "Mohamed Hussien El-Deeb (201900052)",
  ),
  date: true,
)

#tableofcontents()

= 11.2

$
  "Number of cycles per century" 
  &= (1 "century")/(90 "min")  
  = (100 "year"/"century" times 365.25 "day"/"year" times 24 "hr"/"day" times 60 "min"/"hr")/(90 "min") \
  &= 584400
$
  For the one cycle
$
  Delta phi.alt_"1-cycle"
  &= (6 pi G M) / (r_c c^2) 
  = (6 pi "rad" times 6.6743 times 10^(-11) "m"^3/("s"^2 dot "kg") times 5.9722 times 10^(24) "kg")/(6500 times 10^3 "m" times (299 792 458 "m"/"s")^2) dot (3600 times 180/pi "arcsec"/"rad") \
  &approx 0.00265 "arcsec"
$

Precession rate per century

$
  Delta phi.alt_"century" 
  &= Delta phi.alt_"1-cycle" times "Number of cycles per century"  \
  &= 1550.32 "arcsec"
$

// $
//   Delta phi.alt = ((6 pi G M) / r_c times 3600 180/pi) / (90 / (100 times 365.25 times 24 times 60)) "arc-seconds per century" = ((6 pi times 6.6743 times 10^(-11) times 5.9722 times 10^(24)) / (6500 times 1000) times 3600 180/pi) / (90 / (100 times 365.25 times 24 times 60)) "arc-seconds per century"
// $

= 11.3

For the one cycle
$
  Delta phi.alt_"1-cycle"
  &= (6 pi G M) / (r_c) 
  = (6 pi "rad" times 2.0 "km")/(400 "km") dot (180/pi deg\/"rad") \
  &approx 5.4 ^degree
$
Period of the orbit at infinity

$
  T &= 2 pi sqrt((r_c ^3)/(G M)) = 2 pi sqrt(((400 "km")^3)/(2.0 "km"))
    approx 35543 "km" approx (35543 "km")/ (3 times 10^5 "s"\/"km")  \
    &approx 0.1185  \
$
$
  therefore
  Delta phi.alt_"unit-time" = (Delta phi.alt_"1-cycle")/ T
  approx 46 degree\/"s"
  
$




= 11.5

a.

  $
    d/(d tau)(g_(mu nu) (d x^nu)/(d tau)) - 1/2 partial_mu g_(alpha beta) (d x^alpha)/(d tau) (d x^beta)/(d tau) = 0
  $

  For $mu = t$,

  $
    d/(d tau)(g_(t t) (d t)/(d tau)) - 1/2 partial_t g_(alpha beta) (d x^alpha)/(d tau) (d x^beta)/(d tau) = 0  \
    d/(d tau)(g_(t t) (d t)/(d tau)) = 0 
    quad => quad 
    g_(t t) (d t)/(d tau) = -e quad "where" e "is a constant"  \
    therefore 
    (1 - (2G M)/r) (d t)/(d tau) = e
  $

    For $mu = phi.alt$,

  $
    d/(d tau)(g_(phi.alt phi.alt) (d phi.alt)/(d tau)) - 1/2 partial_phi.alt g_(alpha beta) (d x^alpha)/(d tau) (d x^beta)/(d tau) = 0  \
    d/(d tau)(g_(phi.alt phi.alt) (d phi.alt)/(d tau)) = 0 
    quad => quad 
    g_(phi.alt phi.alt) (d phi.alt)/(d tau) = l quad "where" l "is a constant"  \
  $
  In the equatorial plane, $theta = pi/2$
  $
    therefore 
    r^2 (d phi.alt)/(d tau) = l 
    quad => quad 
    (d phi.alt)/(d tau) = l/r^2
  $

b.
  In the equatorial plane, $theta = pi/2$:
  $
    sin(theta) = 1, quad
    (d theta)/(d tau) = 0
  $

  $
    u dot u = g_(mu nu) u^mu u^nu = -1  \
    g_(t t) ((d t)/(d tau))^2 + g_(r r) ((d r)/(d tau))^2 + g_(phi.alt phi.alt) ((d phi.alt)/(d tau))^2 = -1   \
    - (1 - (2G M)/r) ((d t)/(d tau))^2 + ((d r)/(d tau))^2 + r^2 ((d phi.alt)/(d tau))^2 = -1 \

    (d t)/(d tau) = e (1 - (2G M)/r)^(-1), quad 
    (d phi.alt)/(d tau) = l/r^2 \

    - e^2 (1 - (2G M)/r)^(-1) + ((d r)/(d tau))^2 + l^2/r^2 = -1  \
    e^2 (1 - (2G M)/r)^(-1) - ((d r)/(d tau))^2 - l^2/r^2 = 1 
  $

c. 
  $
    (d r)/(d tau) = (d r)/(d phi.alt) (d phi.alt)/(d tau) = (d r)/(d phi.alt) l/r^2 \
    
    e^2 (1 - (2G M)/r)^(-1) - ((d r)/(d phi.alt))^2 l^2/r^4 - l^2/r^2 = 1 \

    u = 1/r 
    quad => quad 
    (d u)/(d phi.alt) = -1/r^2 (d r)/(d phi.alt)
    quad => quad 
    (d r)/(d phi.alt) = - r^2 (d u)/(d phi.alt) = - 1/u^2 (d u)/(d phi.alt) \

    e^2 (1 - (2G M)u)^(-1) - ((d u)/(d phi.alt))^2 l^2 - l^2 u^2 = 1 
  $

  Taking the $phi.alt$ derivative,

  $
    2G M e^2 (1 - (2G M)u)^(-2) (d u)/(d phi.alt) - 2 (d u)/(d phi.alt) (d^2 u)/(d phi.alt^2) l^2 - 2 l^2 u (d u)/(d phi.alt) = 0 \
    2G M e^2 (1 - (2G M)u)^(-2) - 2 l^2 ((d^2 u)/(d phi.alt^2) + u ) = 0 \
    (d^2 u)/(d phi.alt^2) + u = (G M e^2)/(l^2 (1 - 2G M u)^2)
  $

d.
  For $2 G M u << 1$,
  $
    (d^2 u)/(d phi.alt^2) + u approx (G M e^2)/l^2 [1 + 4 G M u]  \
    therefore
    (d^2 u)/(d phi.alt^2) + [1 - 4 ((G M e)/l)^2]u = (G M e^2)/l^2 
  $
  
e.
    For $u = u_c$
  $
    (d^2 u)/(d phi.alt^2) = 0 \
    [1 - 4 ((G M e)/l)^2]u_c = (G M e^2)/l^2  \
    u_c = (G M e^2)/(l^2[1 - 4 ((G M e)/l)^2])
  $

f.

  $
    u(phi.alt) = u_c + u_c w(phi.alt) \
    
    u_c (d^2 w)/(d phi.alt^2) + [1 - 4 ((G M e)/l)^2] u_c (1 + w(phi.alt)) = (G M e^2)/l^2 \
    u_c (d^2 w)/(d phi.alt^2) + [1 - 4 ((G M e)/l)^2] u_c  w(phi.alt) = 0 \
    (d^2 w)/(d phi.alt^2) + [1 - 4 ((G M e)/l)^2] w(phi.alt) = 0 \
    w(phi) = A cos(omega phi.alt + phi.alt_0), quad omega = sqrt(1 - 4 ((G M e)/l)^2) \
    
    omega Delta phi.alt = sqrt(1 - 4 ((G M e)/l)^2) Delta phi.alt = 2 pi\
  $
  
  $
    omega &= 2 pi [1 - 4 ((G M e)/l)^2]^(-1/2) \
    &approx 2 pi [1 + 2 ((G M e)/l)^2]  \
    &= 2 pi + 4 pi ((G M e)/l)^2 
  $
  

#bibliography("/references.bib")
#cite(<El-Deeb_PEU-405_Assignments>, form: none)