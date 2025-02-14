#import "/templates/latex.typ": *

#show: article

#maketitle(
  title: "PEU 405 Participation 1",
  authors: (
    "Mohamed Hussien El-Deeb (201900052)",
  ),
  date: true,
)

#tableofcontents()

= 11.11

== Parameters used in the model

$
  r_0           &= 50 \
  r_(1\/2)      &= 50 \
  r_1           &= 50 \
  phi.alt_0     &= 0 \
  l_c           &= r_(1\/2) / sqrt(r_(1\/2)  - 3) \
  tau_c         &= 2 pi r_(1\/2)^2/l_c \
  Delta tau     &= tau_c/500 \
  l             &= 0.75 times l_c \
  r_(n+1)       &= 2 r_n - r_(n-1) + Delta tau^2 (- 1/r_n^2+l^2/r_n^3-(3 l^2)/r_n^4) \
  phi.alt_(n+1) &= phi.alt_n + Delta tau l/[1/2(r_(n+1)+r_n)]^2
$

\
\

== Implementation

#image("docs.png")

preview: https://editor.p5js.org/Mohamed-Hussien-Eldeeb/full/nMFTr9r4V

code: https://editor.p5js.org/Mohamed-Hussien-Eldeeb/sketches/nMFTr9r4V

#bibliography("/references.bib")
#cite(<El-Deeb_PEU-405_Assignments>, form: none)