#let RoyalBlue4 = rgb("#27408b")

#let numeq(eq) = math.equation(block: true, numbering: "[1]", supplement: [], eq)

#let number-until-with(max-level, schema) = (..numbers) => {
  if numbers.pos().len() <= max-level {
    numbering(schema, ..numbers)
  }
}

#let article(
  lang: "en",
  eq-numbering: none,
  text-size: 12pt,
  page-numbering: "1",
  page-numbering-align: center,
  heading-numbering: "1.1  ",
  body,
) = {
  set page(
    margin: (left: 25mm, right: 25mm, top: 30mm, bottom: 30mm),
    numbering: page-numbering,
    number-align: page-numbering-align,
  )
  set enum(numbering: (it => strong(numbering("a)", it))))
  set text(font: "New Computer Modern", lang: lang, size: text-size)
  show math.equation: set text(weight: 400)
  set math.equation(numbering: eq-numbering)
  set heading(numbering: number-until-with(2, heading-numbering))
  // set heading(numbering: heading-numbering)
  show heading: it => [#v(10pt)#it#v(10pt)]
  show heading.where(level: 1): it => {
    pagebreak(weak: true)
    it
  }
  set outline(indent: auto)
  show outline.entry: it => {
    link(it.element.location())[#text(
        size: 11pt,
        [
          #text(RoyalBlue4, it.body)
          #box(width: 1fr, repeat[~.~])
          #it.page
        ],
      )]
  }
  show outline.entry.where(level: 1): it => {
    v(15pt, weak: true)
    link(it.element.location())[#text(
        size: 11pt,
        [
          #text(RoyalBlue4, weight: "bold", it.body)
          #box(width: 1fr, repeat[])
          #strong(it.page)
        ],
      )]
  }

  set table(
    stroke: none,
    gutter: auto,
    fill: none,
    inset: (right: 1.5em),
  )

  show figure.where(kind: table): it => {
    show: pad.with(x: 23pt)
    set align(center)
    v(12.5pt, weak: true)
    if it.has("caption") {
      v(if it.has("gap") { it.gap } else { 17pt }, weak: true)
      strong(it.supplement)
      if it.numbering != none {
        [ ]
        strong(it.counter.display(it.numbering))
      }
      [*: *]
      it.caption.body

      it.body
    }
    v(15pt, weak: true)
  }

  show figure.where(kind: image): it => {
    show: pad.with(x: 23pt)
    set align(center)
    v(12.5pt, weak: true)
    it.body
    if it.has("caption") {
      v(if it.has("gap") { it.gap } else { 17pt }, weak: true)
      strong(it.supplement)
      if it.numbering != none {
        [ ]
        strong(it.counter.display(it.numbering))
      }
      [*: *]
      it.caption.body
    }
    v(15pt, weak: true)
  }

  show ref: it => text(RoyalBlue4, it)

  show link: it => text(RoyalBlue4, it)

  set bibliography(title: [References#v(10pt)])

  set par(justify: true)

  body
}

#let maketitle(
  title: "",
  authors: (),
  date: true,
) = {
  if (date) {
    date = datetime.today().display("[day padding:none]. [month repr:long] [year]")
  } else {
    date = none
  }

  set document(author: authors, title: title)
  let authors-text = {
    set text(size: 1.1em)
    pad(
      top: 0.5em,
      bottom: 0.5em,
      x: 2em,
      grid(
        columns: (1fr,) * calc.min(3, authors.len()),
        gutter: 1em,
        ..authors.map(author => align(center, author)),
      ),
    )
  }

  align(center)[
    #v(60pt)
    #block(text(weight: 400, 18pt, title))
    #v(1em, weak: true)
    #authors-text
    #v(1em, weak: true)
    #block(text(weight: 400, 1.1em, date))
    #v(20pt)
  ]
}

#let tableofcontents() = {
  outline()
  pagebreak()
}
