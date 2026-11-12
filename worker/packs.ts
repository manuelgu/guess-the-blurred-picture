// Built-in packs. Images are Wikipedia lead images hosted on Wikimedia Commons (freely licensed).
// Generated once from the Wikipedia API; the files are imported into R2 when a pack is used.

import type { RevealModeSetting } from "../shared/types";

export interface Pack {
  id: string;
  title: Record<"en" | "de" | "sv", string>;
  emoji: string;
  defaultMode: RevealModeSetting;
  pictures: { answer: string; file: string }[];
}

export const PACKS: Pack[] = [
  {
    "id": "landmarks",
    "title": {
      "en": "World landmarks",
      "de": "Wahrzeichen der Welt",
      "sv": "Världens landmärken"
    },
    "emoji": "🗼",
    "defaultMode": "zoom",
    "pictures": [
      {
        "answer": "Eiffel Tower",
        "file": "File:Tour Eiffel Wikimedia Commons (cropped).jpg"
      },
      {
        "answer": "Statue of Liberty",
        "file": "File:Front view of Statue of Liberty (cropped).jpg"
      },
      {
        "answer": "Colosseum",
        "file": "File:Colosseo 2020.jpg"
      },
      {
        "answer": "Taj Mahal",
        "file": "File:Taj Mahal (Edited).jpeg"
      },
      {
        "answer": "Sydney Opera House",
        "file": "File:Sydney Opera House 2026.jpg"
      },
      {
        "answer": "Golden Gate Bridge",
        "file": "File:Golden Gate Bridge as seen from Battery East.jpg"
      },
      {
        "answer": "Big Ben (Elizabeth Tower)",
        "file": "File:Elizabeth Tower and the north front of the Palace of Westminster, London.jpg"
      },
      {
        "answer": "Machu Picchu",
        "file": "File:Machu Picchu, 2023 (012).jpg"
      },
      {
        "answer": "Christ the Redeemer",
        "file": "File:Christ the Redeemer - Cristo Redentor.jpg"
      },
      {
        "answer": "Great Wall of China",
        "file": "File:The Great Wall of China at Jinshanling-edit.jpg"
      },
      {
        "answer": "Leaning Tower of Pisa",
        "file": "File:Italy - Pisa - Leaning Tower.jpg"
      },
      {
        "answer": "Brandenburg Gate",
        "file": "File:Brandenburger Tor abends.jpg"
      },
      {
        "answer": "Sagrada Família",
        "file": "File:SF maig 2 cropped.jpg"
      },
      {
        "answer": "Stonehenge",
        "file": "File:Stonehenge2007 07 30.jpg"
      },
      {
        "answer": "Petra",
        "file": "File:Al Deir Petra.JPG"
      },
      {
        "answer": "Burj Khalifa",
        "file": "File:Burj Khalifa (worlds tallest building) and the Dubai skyline (25781049892).jpg"
      },
      {
        "answer": "Neuschwanstein Castle",
        "file": "File:Schloss Neuschwanstein 2013.jpg"
      },
      {
        "answer": "Mount Rushmore",
        "file": "File:Mount Rushmore detail view (100MP).jpg"
      },
      {
        "answer": "Angkor Wat",
        "file": "File:Angkor Wat.jpg"
      },
      {
        "answer": "Moai (Easter Island)",
        "file": "File:AhuTongariki.JPG"
      },
      {
        "answer": "Atomium",
        "file": "File:The Atomium during civil twilight (DSCF1135).jpg"
      },
      {
        "answer": "Tower Bridge",
        "file": "File:Tower Bridge at Dawn.jpg"
      },
      {
        "answer": "Moscow Kremlin",
        "file": "File:Moscow Kremlin (8281675670).jpg"
      },
      {
        "answer": "Hagia Sophia",
        "file": "File:Hagia Sophia (228968325).jpeg"
      }
    ]
  },
  {
    "id": "animals",
    "title": {
      "en": "Weird & wonderful animals",
      "de": "Verrückte Tiere",
      "sv": "Märkliga djur"
    },
    "emoji": "🦦",
    "defaultMode": "tiles",
    "pictures": [
      {
        "answer": "Red panda",
        "file": "File:Red Panda (24986761703).jpg"
      },
      {
        "answer": "Axolotl",
        "file": "File:Axolotl ganz.jpg"
      },
      {
        "answer": "Capybara",
        "file": "File:Capybaracropped.jpg"
      },
      {
        "answer": "Platypus",
        "file": "File:Duck-billed platypus (Ornithorhynchus anatinus) Scottsdale.jpg"
      },
      {
        "answer": "Okapi",
        "file": "File:Saint-Aignan (Loir-et-Cher). Okapi.jpg"
      },
      {
        "answer": "Narwhal",
        "file": "File:Нарвал в российской Арктике.jpg"
      },
      {
        "answer": "Pangolin",
        "file": "File:Eupholidota.jpg"
      },
      {
        "answer": "Quokka",
        "file": "File:Setonix brachyurus on Rottnest Island 1.jpg"
      },
      {
        "answer": "Snow leopard",
        "file": "File:Irbis4.JPG"
      },
      {
        "answer": "Flamingo",
        "file": "File:American Flamingo JG.jpg"
      },
      {
        "answer": "Koala",
        "file": "File:Koala climbing tree.jpg"
      },
      {
        "answer": "Chameleon",
        "file": "File:Panther chameleon (Furcifer pardalis) male Nosy Be.jpg"
      },
      {
        "answer": "Tapir",
        "file": "File:Schabrackentapir Tapirus indicus Tiergarten-Nuernberg-1.jpg"
      },
      {
        "answer": "Meerkat",
        "file": "File:Meerkat (Suricata suricatta) Tswalu.jpg"
      },
      {
        "answer": "Puffin",
        "file": "File:Puffin (Fratercula arctica).jpg"
      },
      {
        "answer": "Sloth",
        "file": "File:Bradypus.jpg"
      },
      {
        "answer": "Hedgehog",
        "file": "File:Erinaceus europaeus LC0119.jpg"
      },
      {
        "answer": "Toucan",
        "file": "File:006 Toco toucan in Encontro das Águas State Park Photo by Giles Laurent (cropped).jpg"
      },
      {
        "answer": "Octopus",
        "file": "File:Octopus2.jpg"
      },
      {
        "answer": "Alpaca",
        "file": "File:Alpaca in Higashiyama Zoo - 1.jpg"
      },
      {
        "answer": "Shoebill",
        "file": "File:Balaeniceps rex -Ueno Zoo, Tokyo, Japan-8a.jpg"
      },
      {
        "answer": "Fennec fox",
        "file": "File:Fennec Fox Vulpes zerda.jpg"
      },
      {
        "answer": "Aye-aye",
        "file": "File:Wild aye aye.jpg"
      }
    ]
  },
  {
    "id": "people",
    "title": {
      "en": "Famous faces",
      "de": "Berühmte Gesichter",
      "sv": "Kända ansikten"
    },
    "emoji": "🧑‍🎤",
    "defaultMode": "pixelate",
    "pictures": [
      {
        "answer": "Albert Einstein",
        "file": "File:Albert Einstein Head cleaned.jpg"
      },
      {
        "answer": "Marie Curie",
        "file": "File:Marie Curie c. 1920s.jpg"
      },
      {
        "answer": "Abraham Lincoln",
        "file": "File:Abraham Lincoln O-77 matte collodion print.jpg"
      },
      {
        "answer": "Frida Kahlo",
        "file": "File:Frida Kahlo, by Guillermo Kahlo.jpg"
      },
      {
        "answer": "Mahatma Gandhi",
        "file": "File:Mahatma-Gandhi, studio, 1931.jpg"
      },
      {
        "answer": "Nelson Mandela",
        "file": "File:Nelson Mandela 1994.jpg"
      },
      {
        "answer": "Winston Churchill",
        "file": "File:Sir Winston Churchill - 19086236948 (restored).jpg"
      },
      {
        "answer": "Queen Elizabeth II",
        "file": "File:Queen Elizabeth II official portrait for 1959 tour (retouched) (cropped) (3-to-4 aspect ratio).jpg"
      },
      {
        "answer": "Barack Obama",
        "file": "File:President Barack Obama.jpg"
      },
      {
        "answer": "Angela Merkel",
        "file": "File:Angela Merkel 2019 cropped.jpg"
      },
      {
        "answer": "Charlie Chaplin",
        "file": "File:Charlie Chaplin portrait Getty 1739411952.jpg"
      },
      {
        "answer": "Marilyn Monroe",
        "file": "File:Monroecirca1953.jpg"
      },
      {
        "answer": "Elvis Presley",
        "file": "File:Elvis Presley promoting Jailhouse Rock.jpg"
      },
      {
        "answer": "Freddie Mercury",
        "file": "File:Freddie Mercury performing in New Haven, CT, November 1977.jpg"
      },
      {
        "answer": "Mona Lisa",
        "file": "File:Mona Lisa, by Leonardo da Vinci, from C2RMF retouched.jpg"
      },
      {
        "answer": "Ludwig van Beethoven",
        "file": "File:Joseph Karl Stieler's Beethoven mit dem Manuskript der Missa solemnis.jpg"
      },
      {
        "answer": "Wolfgang Amadeus Mozart",
        "file": "File:The Mozart Family - Wolfgang Amadeus Mozart headshot.jpg"
      },
      {
        "answer": "Napoleon",
        "file": "File:Jacques-Louis David - The Emperor Napoleon in His Study at the Tuileries - Google Art Project.jpg"
      },
      {
        "answer": "Cleopatra",
        "file": "File:Kleopatra-VII.-Altes-Museum-Berlin1.jpg"
      },
      {
        "answer": "Audrey Hepburn",
        "file": "File:AudreyKHepburn.jpg"
      },
      {
        "answer": "Muhammad Ali",
        "file": "File:Muhammad Ali NYWTS.jpg"
      },
      {
        "answer": "Greta Thunberg",
        "file": "File:Greta Thunberg in May 2026 (cropped 3x4).jpg"
      },
      {
        "answer": "Taylor Swift",
        "file": "File:Taylor Swift at the 2023 MTV Video Music Awards (3).png"
      }
    ]
  },
  {
    "id": "food",
    "title": {
      "en": "Food from around the world",
      "de": "Essen aus aller Welt",
      "sv": "Mat från hela världen"
    },
    "emoji": "🍜",
    "defaultMode": "blur",
    "pictures": [
      {
        "answer": "Sushi",
        "file": "File:Sushi platter.jpg"
      },
      {
        "answer": "Pizza",
        "file": "File:Pizza-3007395.jpg"
      },
      {
        "answer": "Croissant",
        "file": "File:Croissant-Petr Kratochvil.jpg"
      },
      {
        "answer": "Pretzel",
        "file": "File:BrezelnSalz02 (cropped).JPG"
      },
      {
        "answer": "Paella",
        "file": "File:01 Paella Valenciana original.jpg"
      },
      {
        "answer": "Taco",
        "file": "File:001 Tacos de carnitas, carne asada y al pastor.jpg"
      },
      {
        "answer": "Ramen",
        "file": "File:Shoyu Ramen（Tokyo Ramen） - 01.jpg"
      },
      {
        "answer": "Baklava",
        "file": "File:Baklava(1).png"
      },
      {
        "answer": "Kimchi",
        "file": "File:Various kimchi.jpg"
      },
      {
        "answer": "Falafel",
        "file": "File:Falafels 2.jpg"
      },
      {
        "answer": "Spaghetti",
        "file": "File:Spaghettoni.jpg"
      },
      {
        "answer": "Hamburger",
        "file": "File:RedDot Burger.jpg"
      },
      {
        "answer": "Dim sum",
        "file": "File:Chinese DimSum (9023590541).jpg"
      },
      {
        "answer": "Churro",
        "file": "File:Chocolate con churros (27343655726).jpg"
      },
      {
        "answer": "Pierogi",
        "file": "File:Pierogi z masłem - 2023.03.31.jpg"
      },
      {
        "answer": "Kanelbulle (cinnamon bun)",
        "file": "File:Cinnamon roll in Stockholm.jpg"
      },
      {
        "answer": "Schnitzel",
        "file": "File:Breitenlesau Krug Bräu Schnitzel.JPG"
      },
      {
        "answer": "Macaron",
        "file": "File:VanillaMacaron.jpg"
      },
      {
        "answer": "Pho",
        "file": "File:Bowl of Meatball pho.jpg"
      },
      {
        "answer": "Guacamole",
        "file": "File:Guacamole IMGP1271.jpg"
      }
    ]
  }
];
