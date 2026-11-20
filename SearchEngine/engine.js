// Search Engine Lab: the search engine's list of web pages and how it ranks them (Year 6, 6.3.4 Searching the Web).
// Shared by SearchEngine/index.html and tools/test_search_engine.mjs (node: module.exports). The Network Help Desk
// lesson 2.4 jobs use the same rules, so a search ranks the same way in both.
// Rules, in the lesson's words:
//   1. Small words (how, the, is, I ...) are on almost every page, so they are left out of the search.
//   2. A page is in the results if it has at least one search term.
//   3. Rank: pages with more of the search terms come first; then a term in the title counts 3, in the text 1;
//      then the search engine's own list order.
//   4. A search word matches a page word that is the same or the same plus a short ending (same()).
//   5. A word that is on no page at all is spelt wrong or not in the list: the engine says so.
(function (root) {
  'use strict';
  var PAGES = [
    { id: 'library', url: 'www.greenhill-library.example', title: 'Greenhill Library: Opening Times', text: 'Greenhill Library is open from 9 am to 5 pm, Monday to Saturday. It is closed on Sunday.' },
    { id: 'books', url: 'www.greenhill-library.example/books', title: 'Greenhill Library: Borrow Books', text: 'With a library card you can borrow 6 books for 3 weeks.' },
    { id: 'newlib', url: 'www.greenhill-news.example', title: 'Greenhill News: A New Library Next Year', text: 'A second library will open in Greenhill next year, near the park.' },
    { id: 'dentist', url: 'www.greenhill-dentist.example', title: 'Greenhill Dentist: Opening Times', text: 'The dentist is open from 10 am to 4 pm, Monday to Friday.' },
    { id: 'pool', url: 'www.greenhill-pool.example', title: 'Greenhill Swimming Pool: Ticket Prices', text: 'A child ticket costs 40 baht. An adult ticket costs 80 baht. The pool is open from 7 am to 7 pm.' },
    { id: 'swimlessons', url: 'www.greenhill-pool.example/lessons', title: 'Swimming Lessons for Children', text: 'Swimming lessons for children are on Saturday at 10 am at the Greenhill pool.' },
    { id: 'zoo', url: 'www.greenhill-zoo.example', title: 'Greenhill Zoo: Tickets and Opening Times', text: 'The zoo is open from 8 am to 6 pm every day. A child ticket costs 100 baht.' },
    { id: 'bus', url: 'www.greenhill-buses.example', title: 'Greenhill Bus Times', text: 'The number 5 bus goes to the zoo every 20 minutes. The number 8 bus goes to the pool every 30 minutes.' },
    { id: 'tiger', url: 'www.animal-facts.example/tiger', title: 'Tigers: Facts for Kids', text: 'Tigers live in Asia. A big tiger can weigh 300 kg. Every tiger has its own stripes.' },
    { id: 'housemouse', url: 'www.animal-facts.example/mouse', title: 'House Mouse: Animal Facts', text: 'A house mouse is about 8 cm long. It eats seeds and can jump 30 cm high.' },
    { id: 'buymouse', url: 'www.tech-shop.example/mouse', title: 'Computer Mouse: Buy Online', text: 'A computer mouse with no cable costs 350 baht. It works with any laptop.' },
    { id: 'fixmouse', url: 'www.tech-shop.example/help', title: 'Fix a Computer Mouse That Stops Working', text: 'If your computer mouse stops working, put in new batteries first. Then clean the light under the mouse.' },
    { id: 'volcano', url: 'www.earth-kids.example/volcano', title: 'Volcanoes: Facts for Kids', text: 'A volcano erupts when hot melted rock pushes up from under the ground. The hot rock is called lava.' },
    { id: 'weather', url: 'www.greenhill-weather.example', title: 'Greenhill Weather This Week', text: 'Sunny and 33 degrees today. Rain is coming on Friday.' },
    { id: 'pizza', url: 'www.easy-recipes.example/pizza', title: 'Easy Pizza Recipe', text: 'Put the cheese on top, then bake the pizza for 15 minutes.' },
    { id: 'mango', url: 'www.easy-recipes.example/mango', title: 'Mango Sticky Rice Recipe', text: 'Soak the rice for 4 hours, then steam it for 25 minutes. Serve with mango.' },
    { id: 'football', url: 'www.greenhill-football.example', title: 'Greenhill Football Club: Results', text: 'Greenhill won 3 to 1 on Saturday. The next match is at home.' },
    { id: 'training', url: 'www.greenhill-football.example/kids', title: 'Football Training for Children', text: 'Football training for children is on Wednesday at 4 pm. Bring a water bottle.' },
    { id: 'moon', url: 'www.space-kids.example/moon', title: 'The Moon: Facts for Kids', text: 'The Moon is about 384000 km from Earth. It goes round the Earth in about 27 days.' },
    { id: 'mars', url: 'www.space-kids.example/mars', title: 'Mars: The Red Planet', text: 'A day on Mars is 24 hours and 37 minutes. Mars has two small moons.' },
    { id: 'cat', url: 'www.pet-care.example/cat', title: 'How to Look After a Cat', text: 'Feed an adult cat twice a day and give it fresh water every day.' },
    { id: 'dog', url: 'www.pet-care.example/dog', title: 'How to Look After a Dog', text: 'Walk a dog every day and feed it once or twice a day.' },
    { id: 'chess', url: 'www.board-games.example/chess', title: 'Chess: How the Pieces Move', text: 'The knight moves in an L shape. The bishop moves on the diagonals.' },
    { id: 'holiday', url: 'www.greenhill-school.example/holidays', title: 'Greenhill School Holidays', text: 'The school holiday starts on 20 December and ends on 5 January.' },
  ];
  // small words: on almost every page, so they do not help a search
  var SMALL = ['a', 'an', 'the', 'how', 'do', 'does', 'did', 'i', 'is', 'are', 'was', 'what', 'when', 'where', 'who', 'why', 'which', 'can', 'could', 'you', 'your', 'my', 'me', 'we', 'to', 'of', 'for', 'in', 'on', 'at', 'by', 'it', 'its', 'and', 'or', 'please', 'want', 'need', 'find', 'tell', 'about', 'there', 'this', 'that', 'with', 'from', 'be', 'some', 'any', 'much', 'many', 'help'];

  function stem(w) { return w.length > 3 ? w.replace(/ies$/, 'y').replace(/(s|x|ch|sh)es$/, '$1').replace(/([^s])s$/, '$1') : w; }
  // a search word matches a page word when they are the same, or one is the other plus a short ending (close, closed;
  // open, opening; weigh, weight), for words of 4 letters or more
  function same(a, b) {
    if (a === b) return true;
    var s = a.length < b.length ? a : b, l = a.length < b.length ? b : a;
    return s.length >= 4 && l.length - s.length <= 3 && l.indexOf(s) === 0;
  }
  function has(list, k) { for (var i = 0; i < list.length; i++) if (same(list[i], k)) return true; return false; }
  function words(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').split(/\s+/).filter(Boolean); }
  var INDEX = PAGES.map(function (p) {
    return { title: words(p.title).map(stem), text: words(p.text).map(stem) };
  });

  // What a search does with what was typed: the key words it uses, the small words it left out, and any word that is
  // on no page in the list (spelt wrong, or not in the list).
  function read(search) {
    var typed = words(search), keys = [], small = [], unknown = [];
    typed.forEach(function (w) {
      if (SMALL.indexOf(w) >= 0) { if (small.indexOf(w) < 0) small.push(w); return; }
      var s = stem(w);
      if (keys.indexOf(s) >= 0) return;
      keys.push(s);
      if (!INDEX.some(function (ix) { return has(ix.title, s) || has(ix.text, s); })) unknown.push(w);
    });
    return { typed: typed, keys: keys, small: small, unknown: unknown };
  }

  // The ranked results: [{ page, matched, score, inTitle: [...], inText: [...] }], best first.
  function search(q) {
    var r = read(q);
    var out = [];
    PAGES.forEach(function (p, i) {
      var inTitle = [], inText = [];
      r.keys.forEach(function (k) {
        if (has(INDEX[i].title, k)) inTitle.push(k);
        else if (has(INDEX[i].text, k)) inText.push(k);
      });
      var matched = inTitle.length + inText.length;
      if (matched) out.push({ page: p, order: i, matched: matched, score: inTitle.length * 3 + inText.length, inTitle: inTitle, inText: inText });
    });
    out.sort(function (a, b) { return b.matched - a.matched || b.score - a.score || a.order - b.order; });
    return { read: r, results: out };
  }
  function rankOf(q, id) {
    var res = search(q).results;
    for (var i = 0; i < res.length; i++) if (res[i].page.id === id) return i + 1;
    return 0;
  }
  function page(id) { for (var i = 0; i < PAGES.length; i++) if (PAGES[i].id === id) return PAGES[i]; return null; }

  var api = { PAGES: PAGES, SMALL: SMALL, read: read, search: search, rankOf: rankOf, page: page, words: words, stem: stem, same: same };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.SearchEngine = api;
})(this);
