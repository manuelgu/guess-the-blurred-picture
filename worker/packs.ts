// Built-in packs. Images are Wikipedia lead images hosted on Wikimedia Commons (freely licensed).
// Generated once from the Wikipedia API; the files are imported into R2 when a pack is used.

import type { RevealModeSetting } from "../shared/types";

export interface Pack {
  id: string;
  title: Record<"en" | "de" | "sv", string>;
  emoji: string;
  defaultMode: RevealModeSetting;
  /** `wiki`: the Wikipedia article the picture was taken from ("sv:Karlatornet"). */
  pictures: { answer: string; file: string; wiki?: string }[];
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
        "file": "File:Tour Eiffel Wikimedia Commons (cropped).jpg",
        "wiki": "en:Eiffel Tower"
      },
      {
        "answer": "Statue of Liberty",
        "file": "File:Front view of Statue of Liberty (cropped).jpg",
        "wiki": "en:Statue of Liberty"
      },
      {
        "answer": "Colosseum",
        "file": "File:Colosseo 2020.jpg",
        "wiki": "en:Colosseum"
      },
      {
        "answer": "Taj Mahal",
        "file": "File:Taj Mahal (Edited).jpeg",
        "wiki": "en:Taj Mahal"
      },
      {
        "answer": "Sydney Opera House",
        "file": "File:Sydney Opera House 2026.jpg",
        "wiki": "en:Sydney Opera House"
      },
      {
        "answer": "Golden Gate Bridge",
        "file": "File:Golden Gate Bridge as seen from Battery East.jpg",
        "wiki": "en:Golden Gate Bridge"
      },
      {
        "answer": "Big Ben (Elizabeth Tower)",
        "file": "File:Elizabeth Tower and the north front of the Palace of Westminster, London.jpg",
        "wiki": "en:Big Ben"
      },
      {
        "answer": "Machu Picchu",
        "file": "File:Machu Picchu, 2023 (012).jpg",
        "wiki": "en:Machu Picchu"
      },
      {
        "answer": "Christ the Redeemer",
        "file": "File:Christ the Redeemer - Cristo Redentor.jpg",
        "wiki": "en:Christ the Redeemer (statue)"
      },
      {
        "answer": "Great Wall of China",
        "file": "File:The Great Wall of China at Jinshanling-edit.jpg",
        "wiki": "en:Great Wall of China"
      },
      {
        "answer": "Leaning Tower of Pisa",
        "file": "File:Italy - Pisa - Leaning Tower.jpg",
        "wiki": "en:Leaning Tower of Pisa"
      },
      {
        "answer": "Brandenburg Gate",
        "file": "File:Brandenburger Tor abends.jpg",
        "wiki": "en:Brandenburg Gate"
      },
      {
        "answer": "Sagrada Família",
        "file": "File:SF maig 2 cropped.jpg",
        "wiki": "en:Sagrada Família"
      },
      {
        "answer": "Stonehenge",
        "file": "File:Stonehenge2007 07 30.jpg",
        "wiki": "en:Stonehenge"
      },
      {
        "answer": "Petra",
        "file": "File:Al Deir Petra.JPG",
        "wiki": "en:Petra"
      },
      {
        "answer": "Burj Khalifa",
        "file": "File:Burj Khalifa (worlds tallest building) and the Dubai skyline (25781049892).jpg",
        "wiki": "en:Burj Khalifa"
      },
      {
        "answer": "Neuschwanstein Castle",
        "file": "File:Schloss Neuschwanstein 2013.jpg",
        "wiki": "en:Neuschwanstein Castle"
      },
      {
        "answer": "Mount Rushmore",
        "file": "File:Mount Rushmore detail view (100MP).jpg",
        "wiki": "en:Mount Rushmore"
      },
      {
        "answer": "Angkor Wat",
        "file": "File:Angkor Wat.jpg",
        "wiki": "en:Angkor Wat"
      },
      {
        "answer": "Moai (Easter Island)",
        "file": "File:AhuTongariki.JPG",
        "wiki": "en:Moai"
      },
      {
        "answer": "Atomium",
        "file": "File:The Atomium during civil twilight (DSCF1135).jpg",
        "wiki": "en:Atomium"
      },
      {
        "answer": "Tower Bridge",
        "file": "File:Tower Bridge at Dawn.jpg",
        "wiki": "en:Tower Bridge"
      },
      {
        "answer": "Moscow Kremlin",
        "file": "File:Moscow Kremlin (8281675670).jpg",
        "wiki": "en:Moscow Kremlin"
      },
      {
        "answer": "Hagia Sophia",
        "file": "File:Hagia Sophia (228968325).jpeg",
        "wiki": "en:Hagia Sophia"
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
        "file": "File:Red Panda (24986761703).jpg",
        "wiki": "en:Red panda"
      },
      {
        "answer": "Axolotl",
        "file": "File:Axolotl ganz.jpg",
        "wiki": "en:Axolotl"
      },
      {
        "answer": "Capybara",
        "file": "File:Capybaracropped.jpg",
        "wiki": "en:Capybara"
      },
      {
        "answer": "Platypus",
        "file": "File:Duck-billed platypus (Ornithorhynchus anatinus) Scottsdale.jpg",
        "wiki": "en:Platypus"
      },
      {
        "answer": "Okapi",
        "file": "File:Saint-Aignan (Loir-et-Cher). Okapi.jpg",
        "wiki": "en:Okapi"
      },
      {
        "answer": "Narwhal",
        "file": "File:Нарвал в российской Арктике.jpg",
        "wiki": "en:Narwhal"
      },
      {
        "answer": "Pangolin",
        "file": "File:Eupholidota.jpg",
        "wiki": "en:Pangolin"
      },
      {
        "answer": "Quokka",
        "file": "File:Setonix brachyurus on Rottnest Island 1.jpg",
        "wiki": "en:Quokka"
      },
      {
        "answer": "Snow leopard",
        "file": "File:Irbis4.JPG",
        "wiki": "en:Snow leopard"
      },
      {
        "answer": "Flamingo",
        "file": "File:American Flamingo JG.jpg",
        "wiki": "en:American flamingo"
      },
      {
        "answer": "Koala",
        "file": "File:Koala climbing tree.jpg",
        "wiki": "en:Koala"
      },
      {
        "answer": "Chameleon",
        "file": "File:Panther chameleon (Furcifer pardalis) male Nosy Be.jpg",
        "wiki": "en:Panther chameleon"
      },
      {
        "answer": "Tapir",
        "file": "File:Schabrackentapir Tapirus indicus Tiergarten-Nuernberg-1.jpg",
        "wiki": "en:Malayan tapir"
      },
      {
        "answer": "Meerkat",
        "file": "File:Meerkat (Suricata suricatta) Tswalu.jpg",
        "wiki": "en:Meerkat"
      },
      {
        "answer": "Puffin",
        "file": "File:Puffin (Fratercula arctica).jpg",
        "wiki": "en:Atlantic puffin"
      },
      {
        "answer": "Sloth",
        "file": "File:Bradypus.jpg",
        "wiki": "en:Brown-throated sloth"
      },
      {
        "answer": "Hedgehog",
        "file": "File:Erinaceus europaeus LC0119.jpg",
        "wiki": "en:European hedgehog"
      },
      {
        "answer": "Toucan",
        "file": "File:006 Toco toucan in Encontro das Águas State Park Photo by Giles Laurent (cropped).jpg",
        "wiki": "en:Toco toucan"
      },
      {
        "answer": "Octopus",
        "file": "File:Octopus2.jpg",
        "wiki": "en:Common octopus"
      },
      {
        "answer": "Alpaca",
        "file": "File:Alpaca in Higashiyama Zoo - 1.jpg",
        "wiki": "en:Alpaca"
      },
      {
        "answer": "Shoebill",
        "file": "File:Balaeniceps rex -Ueno Zoo, Tokyo, Japan-8a.jpg",
        "wiki": "en:Shoebill"
      },
      {
        "answer": "Fennec fox",
        "file": "File:Fennec Fox Vulpes zerda.jpg",
        "wiki": "en:Fennec fox"
      },
      {
        "answer": "Aye-aye",
        "file": "File:Wild aye aye.jpg",
        "wiki": "en:Aye-aye"
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
        "file": "File:Albert Einstein Head cleaned.jpg",
        "wiki": "en:Albert Einstein"
      },
      {
        "answer": "Marie Curie",
        "file": "File:Marie Curie c. 1920s.jpg",
        "wiki": "en:Marie Curie"
      },
      {
        "answer": "Abraham Lincoln",
        "file": "File:Abraham Lincoln O-77 matte collodion print.jpg",
        "wiki": "en:Abraham Lincoln"
      },
      {
        "answer": "Frida Kahlo",
        "file": "File:Frida Kahlo, by Guillermo Kahlo.jpg",
        "wiki": "en:Frida Kahlo"
      },
      {
        "answer": "Mahatma Gandhi",
        "file": "File:Mahatma-Gandhi, studio, 1931.jpg",
        "wiki": "en:Mahatma Gandhi"
      },
      {
        "answer": "Nelson Mandela",
        "file": "File:Nelson Mandela 1994.jpg",
        "wiki": "en:Nelson Mandela"
      },
      {
        "answer": "Winston Churchill",
        "file": "File:Sir Winston Churchill - 19086236948 (restored).jpg",
        "wiki": "en:Winston Churchill"
      },
      {
        "answer": "Queen Elizabeth II",
        "file": "File:Queen Elizabeth II official portrait for 1959 tour (retouched) (cropped) (3-to-4 aspect ratio).jpg",
        "wiki": "en:Elizabeth II"
      },
      {
        "answer": "Barack Obama",
        "file": "File:President Barack Obama.jpg",
        "wiki": "en:Barack Obama"
      },
      {
        "answer": "Angela Merkel",
        "file": "File:Angela Merkel 2019 cropped.jpg",
        "wiki": "en:Angela Merkel"
      },
      {
        "answer": "Charlie Chaplin",
        "file": "File:Charlie Chaplin portrait Getty 1739411952.jpg",
        "wiki": "en:Charlie Chaplin"
      },
      {
        "answer": "Marilyn Monroe",
        "file": "File:Monroecirca1953.jpg",
        "wiki": "en:Marilyn Monroe"
      },
      {
        "answer": "Elvis Presley",
        "file": "File:Elvis Presley promoting Jailhouse Rock.jpg",
        "wiki": "en:Elvis Presley"
      },
      {
        "answer": "Freddie Mercury",
        "file": "File:Freddie Mercury performing in New Haven, CT, November 1977.jpg",
        "wiki": "en:Freddie Mercury"
      },
      {
        "answer": "Mona Lisa",
        "file": "File:Mona Lisa, by Leonardo da Vinci, from C2RMF retouched.jpg",
        "wiki": "en:Mona Lisa"
      },
      {
        "answer": "Ludwig van Beethoven",
        "file": "File:Joseph Karl Stieler's Beethoven mit dem Manuskript der Missa solemnis.jpg",
        "wiki": "en:Ludwig van Beethoven"
      },
      {
        "answer": "Wolfgang Amadeus Mozart",
        "file": "File:The Mozart Family - Wolfgang Amadeus Mozart headshot.jpg",
        "wiki": "en:Wolfgang Amadeus Mozart"
      },
      {
        "answer": "Napoleon",
        "file": "File:Jacques-Louis David - The Emperor Napoleon in His Study at the Tuileries - Google Art Project.jpg",
        "wiki": "en:Napoleon"
      },
      {
        "answer": "Cleopatra",
        "file": "File:Kleopatra-VII.-Altes-Museum-Berlin1.jpg",
        "wiki": "en:Cleopatra"
      },
      {
        "answer": "Audrey Hepburn",
        "file": "File:AudreyKHepburn.jpg",
        "wiki": "en:Audrey Hepburn"
      },
      {
        "answer": "Muhammad Ali",
        "file": "File:Muhammad Ali NYWTS.jpg",
        "wiki": "en:Muhammad Ali"
      },
      {
        "answer": "Greta Thunberg",
        "file": "File:Greta Thunberg in May 2026 (cropped 3x4).jpg",
        "wiki": "en:Greta Thunberg"
      },
      {
        "answer": "Taylor Swift",
        "file": "File:Taylor Swift at the 2023 MTV Video Music Awards (3).png",
        "wiki": "en:Taylor Swift"
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
        "file": "File:Sushi platter.jpg",
        "wiki": "en:Sushi"
      },
      {
        "answer": "Pizza",
        "file": "File:Pizza-3007395.jpg",
        "wiki": "en:Pizza"
      },
      {
        "answer": "Croissant",
        "file": "File:Croissant-Petr Kratochvil.jpg",
        "wiki": "en:Croissant"
      },
      {
        "answer": "Pretzel",
        "file": "File:BrezelnSalz02 (cropped).JPG",
        "wiki": "en:Pretzel"
      },
      {
        "answer": "Paella",
        "file": "File:01 Paella Valenciana original.jpg",
        "wiki": "en:Paella"
      },
      {
        "answer": "Taco",
        "file": "File:001 Tacos de carnitas, carne asada y al pastor.jpg",
        "wiki": "en:Taco"
      },
      {
        "answer": "Ramen",
        "file": "File:Shoyu Ramen（Tokyo Ramen） - 01.jpg",
        "wiki": "en:Ramen"
      },
      {
        "answer": "Baklava",
        "file": "File:Baklava(1).png",
        "wiki": "en:Baklava"
      },
      {
        "answer": "Kimchi",
        "file": "File:Various kimchi.jpg",
        "wiki": "en:Kimchi"
      },
      {
        "answer": "Falafel",
        "file": "File:Falafels 2.jpg",
        "wiki": "en:Falafel"
      },
      {
        "answer": "Spaghetti",
        "file": "File:Spaghettoni.jpg",
        "wiki": "en:Spaghetti"
      },
      {
        "answer": "Hamburger",
        "file": "File:RedDot Burger.jpg",
        "wiki": "en:Hamburger"
      },
      {
        "answer": "Dim sum",
        "file": "File:Chinese DimSum (9023590541).jpg",
        "wiki": "en:Dim sum"
      },
      {
        "answer": "Churro",
        "file": "File:Chocolate con churros (27343655726).jpg",
        "wiki": "en:Churro"
      },
      {
        "answer": "Pierogi",
        "file": "File:Pierogi z masłem - 2023.03.31.jpg",
        "wiki": "en:Pierogi"
      },
      {
        "answer": "Kanelbulle (cinnamon bun)",
        "file": "File:Cinnamon roll in Stockholm.jpg",
        "wiki": "sv:Kanelbulle"
      },
      {
        "answer": "Schnitzel",
        "file": "File:Breitenlesau Krug Bräu Schnitzel.JPG",
        "wiki": "en:Schnitzel"
      },
      {
        "answer": "Macaron",
        "file": "File:VanillaMacaron.jpg",
        "wiki": "en:Macaron"
      },
      {
        "answer": "Pho",
        "file": "File:Bowl of Meatball pho.jpg",
        "wiki": "en:Pho"
      },
      {
        "answer": "Guacamole",
        "file": "File:Guacamole IMGP1271.jpg",
        "wiki": "en:Guacamole"
      }
    ]
  },
  {
    "id": "paintings",
    "title": {
      "en": "Famous paintings",
      "de": "Berühmte Gemälde",
      "sv": "Kända målningar"
    },
    "emoji": "🖼️",
    "defaultMode": "spotlight",
    "pictures": [
      {
        "answer": "Mona Lisa",
        "file": "File:Mona Lisa, by Leonardo da Vinci, from C2RMF retouched.jpg",
        "wiki": "en:Mona Lisa"
      },
      {
        "answer": "The Starry Night",
        "file": "File:Van Gogh - Starry Night - Google Art Project.jpg",
        "wiki": "en:The Starry Night"
      },
      {
        "answer": "The Scream",
        "file": "File:Edvard Munch, 1893, The Scream, oil, tempera and pastel on cardboard, 91 x 73 cm, National Gallery of Norway.jpg",
        "wiki": "en:The Scream"
      },
      {
        "answer": "Girl with a Pearl Earring",
        "file": "File:1665 Girl with a Pearl Earring.jpg",
        "wiki": "en:Girl with a Pearl Earring"
      },
      {
        "answer": "The Birth of Venus",
        "file": "File:Sandro Botticelli - La nascita di Venere - Google Art Project - edited.jpg",
        "wiki": "en:The Birth of Venus"
      },
      {
        "answer": "The Last Supper",
        "file": "File:The Last Supper - Leonardo Da Vinci - High Resolution 32x16.jpg",
        "wiki": "en:The Last Supper (Leonardo)"
      },
      {
        "answer": "The Great Wave off Kanagawa",
        "file": "File:Tsunami by hokusai 19th century.jpg",
        "wiki": "en:The Great Wave off Kanagawa"
      },
      {
        "answer": "Water Lilies (Monet)",
        "file": "File:Reflections of Clouds on the Water-Lily Pond.jpg",
        "wiki": "en:Water Lilies (Monet series)"
      },
      {
        "answer": "The Kiss (Klimt)",
        "file": "File:The Kiss - Gustav Klimt - Google Cultural Institute.jpg",
        "wiki": "en:The Kiss (Klimt)"
      },
      {
        "answer": "Sunflowers (Van Gogh)",
        "file": "File:Vincent Willem van Gogh 127.jpg",
        "wiki": "en:Sunflowers (Van Gogh series)"
      },
      {
        "answer": "The Creation of Adam",
        "file": "File:Michelangelo - Creation of Adam (cropped).jpg",
        "wiki": "en:The Creation of Adam"
      },
      {
        "answer": "The Night Watch",
        "file": "File:La ronda de noche, por Rembrandt van Rijn.jpg",
        "wiki": "en:The Night Watch"
      },
      {
        "answer": "Las Meninas",
        "file": "File:Las Meninas, by Diego Velázquez, from Prado in Google Earth.jpg",
        "wiki": "en:Las Meninas"
      },
      {
        "answer": "Liberty Leading the People",
        "file": "File:La Liberté guidant le peuple - Eugène Delacroix - Musée du Louvre Peintures RF 129 - après restauration 2024.jpg",
        "wiki": "en:Liberty Leading the People"
      },
      {
        "answer": "Wanderer above the Sea of Fog",
        "file": "File:Caspar David Friedrich - Wanderer above the Sea of Fog.jpeg",
        "wiki": "en:Wanderer above the Sea of Fog"
      },
      {
        "answer": "A Sunday Afternoon on the Island of La Grande Jatte",
        "file": "File:A Sunday on La Grande Jatte, Georges Seurat, 1884.jpg",
        "wiki": "en:A Sunday Afternoon on the Island of La Grande Jatte"
      },
      {
        "answer": "Whistler's Mother",
        "file": "File:Whistlers Mother high res.jpg",
        "wiki": "en:Whistler's Mother"
      },
      {
        "answer": "The Garden of Earthly Delights",
        "file": "File:The Garden of earthly delights.jpg",
        "wiki": "en:The Garden of Earthly Delights"
      },
      {
        "answer": "Impression, Sunrise",
        "file": "File:Monet - Impression, Sunrise.jpg",
        "wiki": "en:Impression, Sunrise"
      },
      {
        "answer": "American Gothic",
        "file": "File:Grant Wood - American Gothic (1930).jpg",
        "wiki": "en:American Gothic"
      },
      {
        "answer": "The School of Athens",
        "file": "File:\"The School of Athens\" by Raffaello Sanzio da Urbino.jpg",
        "wiki": "en:The School of Athens"
      },
      {
        "answer": "The Hay Wain",
        "file": "File:John Constable - The Hay Wain (1821).jpg",
        "wiki": "en:The Hay Wain"
      },
      {
        "answer": "The Arnolfini Portrait",
        "file": "File:The Arnolfini portrait (1434).jpg",
        "wiki": "en:The Arnolfini Portrait"
      },
      {
        "answer": "The Tower of Babel",
        "file": "File:Pieter Bruegel the Elder - The Tower of Babel (Vienna) - Google Art Project - edited.jpg",
        "wiki": "en:The Tower of Babel (Bruegel)"
      },
      {
        "answer": "Nighthawks",
        "file": "File:Nighthawks by Edward Hopper 1942.jpg",
        "wiki": "en:Nighthawks (painting)"
      }
    ]
  },
  {
    "id": "flags",
    "title": {
      "en": "Flags of the world",
      "de": "Flaggen der Welt",
      "sv": "Världens flaggor"
    },
    "emoji": "🚩",
    "defaultMode": "zoom",
    "pictures": [
      {
        "answer": "Japan",
        "file": "File:Flag of Japan.svg",
        "wiki": "en:Flag of Japan"
      },
      {
        "answer": "Brazil",
        "file": "File:Flag of Brazil.svg",
        "wiki": "en:Flag of Brazil"
      },
      {
        "answer": "Canada",
        "file": "File:Flag of Canada (Pantone).svg",
        "wiki": "en:Flag of Canada"
      },
      {
        "answer": "South Korea",
        "file": "File:Flag of South Korea.svg",
        "wiki": "en:Flag of South Korea"
      },
      {
        "answer": "Switzerland",
        "file": "File:Flag of Switzerland (Pantone).svg",
        "wiki": "en:Flag of Switzerland"
      },
      {
        "answer": "Sweden",
        "file": "File:Flag of Sweden.svg",
        "wiki": "en:Flag of Sweden"
      },
      {
        "answer": "Germany",
        "file": "File:Flag of Germany.svg",
        "wiki": "en:Flag of Germany"
      },
      {
        "answer": "United Kingdom",
        "file": "File:Flag of the United Kingdom (1-2).svg",
        "wiki": "en:Flag of the United Kingdom"
      },
      {
        "answer": "United States",
        "file": "File:Flag of the United States (DDD-F-416E specifications).svg",
        "wiki": "en:Flag of the United States"
      },
      {
        "answer": "India",
        "file": "File:Flag of India.svg",
        "wiki": "en:Flag of India"
      },
      {
        "answer": "Mexico",
        "file": "File:Flag of Mexico.svg",
        "wiki": "en:Flag of Mexico"
      },
      {
        "answer": "Argentina",
        "file": "File:Flag of Argentina.svg",
        "wiki": "en:Flag of Argentina"
      },
      {
        "answer": "South Africa",
        "file": "File:Flag of South Africa.svg",
        "wiki": "en:Flag of South Africa"
      },
      {
        "answer": "Nepal",
        "file": "File:Flag of Nepal.svg",
        "wiki": "en:Flag of Nepal"
      },
      {
        "answer": "Turkey",
        "file": "File:Flag of Turkey.svg",
        "wiki": "en:Flag of Turkey"
      },
      {
        "answer": "Greece",
        "file": "File:Flag of Greece.svg",
        "wiki": "en:Flag of Greece"
      },
      {
        "answer": "Jamaica",
        "file": "File:Flag of Jamaica.svg",
        "wiki": "en:Flag of Jamaica"
      },
      {
        "answer": "Australia",
        "file": "File:Flag of Australia (converted).svg",
        "wiki": "en:Flag of Australia"
      },
      {
        "answer": "Kenya",
        "file": "File:Flag of Kenya.svg",
        "wiki": "en:Flag of Kenya"
      },
      {
        "answer": "Bhutan",
        "file": "File:Flag of Bhutan.svg",
        "wiki": "en:Flag of Bhutan"
      },
      {
        "answer": "Israel",
        "file": "File:Flag of Israel.svg",
        "wiki": "en:Flag of Israel"
      },
      {
        "answer": "China",
        "file": "File:Flag of the People's Republic of China.svg",
        "wiki": "en:Flag of China"
      },
      {
        "answer": "Ireland",
        "file": "File:Flag of Ireland.svg",
        "wiki": "en:Flag of Ireland"
      },
      {
        "answer": "Italy",
        "file": "File:Flag of Italy.svg",
        "wiki": "en:Flag of Italy"
      },
      {
        "answer": "Norway",
        "file": "File:Flag of Norway.svg",
        "wiki": "en:Flag of Norway"
      },
      {
        "answer": "Finland",
        "file": "File:Flag of Finland.svg",
        "wiki": "en:Flag of Finland"
      }
    ]
  },
  {
    "id": "nature",
    "title": {
      "en": "Natural wonders",
      "de": "Naturwunder",
      "sv": "Naturens underverk"
    },
    "emoji": "🏔️",
    "defaultMode": "blur",
    "pictures": [
      {
        "answer": "Grand Canyon",
        "file": "File:Canyon River Tree (165872763).jpeg",
        "wiki": "en:Grand Canyon"
      },
      {
        "answer": "Niagara Falls",
        "file": "File:3Falls Niagara.jpg",
        "wiki": "en:Niagara Falls"
      },
      {
        "answer": "Mount Everest",
        "file": "File:Mt. Everest from Gokyo Ri November 5, 2012.jpg",
        "wiki": "en:Mount Everest"
      },
      {
        "answer": "Uluru",
        "file": "File:ULURU.jpg",
        "wiki": "en:Uluru"
      },
      {
        "answer": "Great Barrier Reef",
        "file": "File:ISS-45 StoryOfWater, Great Barrier Reef, Australia.jpg",
        "wiki": "en:Great Barrier Reef"
      },
      {
        "answer": "Victoria Falls",
        "file": "File:Cataratas Victoria, Zambia-Zimbabue, 2018-07-27, DD 04.jpg",
        "wiki": "en:Victoria Falls"
      },
      {
        "answer": "Mount Fuji",
        "file": "File:View of Mount Fuji from Ōwakudani 20211202.jpg",
        "wiki": "en:Mount Fuji"
      },
      {
        "answer": "Ha Long Bay",
        "file": "File:Ha Long Bay in 2019.jpg",
        "wiki": "en:Ha Long Bay"
      },
      {
        "answer": "Matterhorn",
        "file": "File:Matterhorn from Domhütte - 2.jpg",
        "wiki": "en:Matterhorn"
      },
      {
        "answer": "Iguazu Falls",
        "file": "File:Aerial Foz de Iguaçu 26 Nov 2005.jpg",
        "wiki": "en:Iguazu Falls"
      },
      {
        "answer": "Antelope Canyon",
        "file": "File:USA Antelope-Canyon.jpg",
        "wiki": "en:Antelope Canyon"
      },
      {
        "answer": "Giant's Causeway",
        "file": "File:Causeway-code poet-4.jpg",
        "wiki": "en:Giant's Causeway"
      },
      {
        "answer": "Mount Kilimanjaro",
        "file": "File:Kilimanjaro from Amboseli.jpg",
        "wiki": "en:Mount Kilimanjaro"
      },
      {
        "answer": "Old Faithful",
        "file": "File:Yellowstone National Park (WY, USA), Old Faithful Geyser -- 2022 -- 2599.jpg",
        "wiki": "en:Old Faithful"
      },
      {
        "answer": "Table Mountain",
        "file": "File:Table Mountain DanieVDM.jpg",
        "wiki": "en:Table Mountain"
      },
      {
        "answer": "Pamukkale",
        "file": "File:Pamukkale, Denizli 2026 68.jpg",
        "wiki": "en:Pamukkale"
      },
      {
        "answer": "Preikestolen",
        "file": "File:Lyse Fjord et Preikestolen.jpg",
        "wiki": "en:Preikestolen"
      },
      {
        "answer": "Geirangerfjord",
        "file": "File:Geirangerfjord .jpg",
        "wiki": "en:Geirangerfjord"
      },
      {
        "answer": "Perito Moreno Glacier",
        "file": "File:Perito Moreno Glacier 2023.jpg",
        "wiki": "en:Perito Moreno Glacier"
      },
      {
        "answer": "Zhangjiajie",
        "file": "File:1 tianzishan wulingyuan zhangjiajie 2012.jpg",
        "wiki": "en:Zhangjiajie National Forest Park"
      },
      {
        "answer": "Half Dome",
        "file": "File:Half Dome with Eastern Yosemite Valley (Zuschnitt).jpg",
        "wiki": "en:Half Dome"
      },
      {
        "answer": "Northern lights (aurora)",
        "file": "File:Aurora borealis over Eielson Air Force Base, Alaska.jpg",
        "wiki": "en:Aurora"
      },
      {
        "answer": "Bryce Canyon",
        "file": "File:Inspiration Point Bryce Canyon November 2018 panorama.jpg",
        "wiki": "en:Bryce Canyon National Park"
      },
      {
        "answer": "Lake Bled",
        "file": "File:Lake Bled from the Mountain.jpg",
        "wiki": "en:Lake Bled"
      },
      {
        "answer": "Dead Sea",
        "file": "File:Dead Sea beach 00.JPG",
        "wiki": "en:Dead Sea"
      },
      {
        "answer": "Sahara",
        "file": "File:Sahara real color.jpg",
        "wiki": "en:Sahara"
      }
    ]
  },
  {
    "id": "instruments",
    "title": {
      "en": "Musical instruments",
      "de": "Musikinstrumente",
      "sv": "Musikinstrument"
    },
    "emoji": "🎻",
    "defaultMode": "pixelate",
    "pictures": [
      {
        "answer": "Violin",
        "file": "File:Violin VL100.png",
        "wiki": "en:Violin"
      },
      {
        "answer": "Piano",
        "file": "File:Steinway Vienna 002.JPG",
        "wiki": "en:Piano"
      },
      {
        "answer": "Saxophone",
        "file": "File:Eight saxophone sizes smaller.png",
        "wiki": "en:Saxophone"
      },
      {
        "answer": "Harp",
        "file": "File:Harp.png",
        "wiki": "en:Harp"
      },
      {
        "answer": "Accordion",
        "file": "File:A converter free-bass piano-accordion and a Russian bayan.jpg",
        "wiki": "en:Accordion"
      },
      {
        "answer": "Didgeridoo",
        "file": "File:Australiandidgeridoos.jpg",
        "wiki": "en:Didgeridoo"
      },
      {
        "answer": "Trumpet",
        "file": "File:Yamaha Trumpet YTR-8335LA crop.jpg",
        "wiki": "en:Trumpet"
      },
      {
        "answer": "Cello",
        "file": "File:Cello front side.png",
        "wiki": "en:Cello"
      },
      {
        "answer": "Sitar",
        "file": "File:Sitar, late 19th Century.jpg",
        "wiki": "en:Sitar"
      },
      {
        "answer": "Theremin",
        "file": "File:Etherwave Theremin Kit.jpg",
        "wiki": "en:Theremin"
      },
      {
        "answer": "Harmonica",
        "file": "File:16-hole chrom 10-hole diatonic.jpg",
        "wiki": "en:Harmonica"
      },
      {
        "answer": "Flute",
        "file": "File:Shinobue and other flutes-3.jpg",
        "wiki": "en:Flute"
      },
      {
        "answer": "Clarinet",
        "file": "File:Leitner+Kraus 410 320.png",
        "wiki": "en:Clarinet"
      },
      {
        "answer": "Bassoon",
        "file": "File:FoxBassoon.png",
        "wiki": "en:Bassoon"
      },
      {
        "answer": "Steelpan",
        "file": "File:Steelpan Instruments at Trinidad and Tobago Carnival.jpg",
        "wiki": "en:Steelpan"
      },
      {
        "answer": "Nyckelharpa",
        "file": "File:Nyckelharpa 0930 (cropped).jpg",
        "wiki": "en:Nyckelharpa"
      },
      {
        "answer": "Triangle",
        "file": "File:Triangle 001.jpg",
        "wiki": "en:Triangle (musical instrument)"
      }
    ]
  },
  {
    "id": "dogs",
    "title": {
      "en": "Dog breeds",
      "de": "Hunderassen",
      "sv": "Hundraser"
    },
    "emoji": "🐕",
    "defaultMode": "tiles",
    "pictures": [
      {
        "answer": "Golden Retriever",
        "file": "File:Golden Retriever Dukedestiny01 drvd.jpg",
        "wiki": "en:Golden Retriever"
      },
      {
        "answer": "Dachshund",
        "file": "File:닥스훈트(단모종) (Dachshund (Short)).jpg",
        "wiki": "en:Dachshund"
      },
      {
        "answer": "Pug",
        "file": "File:Mops oct09 cropped2.jpg",
        "wiki": "en:Pug"
      },
      {
        "answer": "Siberian Husky",
        "file": "File:Husky L.jpg",
        "wiki": "en:Siberian Husky"
      },
      {
        "answer": "Corgi",
        "file": "File:Welsh Pembroke Corgi.jpg",
        "wiki": "en:Pembroke Welsh Corgi"
      },
      {
        "answer": "Dalmatian",
        "file": "File:Sun Dog Dalmatian.jpg",
        "wiki": "en:Dalmatian dog"
      },
      {
        "answer": "Poodle",
        "file": "File:Full attention (8067543690).jpg",
        "wiki": "en:Poodle"
      },
      {
        "answer": "Beagle",
        "file": "File:Beagle 600.jpg",
        "wiki": "en:Beagle"
      },
      {
        "answer": "Border Collie",
        "file": "File:Border Collie 600.jpg",
        "wiki": "en:Border Collie"
      },
      {
        "answer": "German Shepherd",
        "file": "File:German Shepherd - DSC 0346 (10096362833).jpg",
        "wiki": "en:German Shepherd"
      },
      {
        "answer": "Labrador Retriever",
        "file": "File:Labrador on Quantock (2175262184).jpg",
        "wiki": "en:Labrador Retriever"
      },
      {
        "answer": "Shiba Inu",
        "file": "File:Taka Shiba.jpg",
        "wiki": "en:Shiba Inu"
      },
      {
        "answer": "Bulldog",
        "file": "File:Whitebulldog.jpg",
        "wiki": "en:Bulldog"
      },
      {
        "answer": "Great Dane",
        "file": "File:Dog niemiecki żółty LM980.jpg",
        "wiki": "en:Great Dane"
      },
      {
        "answer": "St. Bernard",
        "file": "File:Hummel Vedor vd Robandahoeve.jpg",
        "wiki": "en:St. Bernard (dog)"
      },
      {
        "answer": "Bernese Mountain Dog",
        "file": "File:3-BerneseMountainDogInGrass.jpg",
        "wiki": "en:Bernese Mountain Dog"
      },
      {
        "answer": "Pomeranian",
        "file": "File:Pomeranian.JPG",
        "wiki": "en:Pomeranian dog"
      },
      {
        "answer": "Komondor",
        "file": "File:Komondor delvin.jpg",
        "wiki": "en:Komondor"
      },
      {
        "answer": "Basset Hound",
        "file": "File:BassetHound profil.jpg",
        "wiki": "en:Basset Hound"
      },
      {
        "answer": "Samoyed",
        "file": "File:Samojed00.jpg",
        "wiki": "en:Samoyed dog"
      },
      {
        "answer": "Old English Sheepdog",
        "file": "File:Old English Sheepdog (side).jpg",
        "wiki": "en:Old English Sheepdog"
      }
    ]
  },
  {
    "id": "sweden-places",
    "title": {
      "en": "Places in Sweden",
      "de": "Orte in Schweden",
      "sv": "Sverige på kartan"
    },
    "emoji": "🗺️",
    "defaultMode": "zoom",
    "pictures": [
      {
        "answer": "Turning Torso (Malmö)",
        "file": "File:Turning Torso 3.jpg",
        "wiki": "sv:Turning Torso"
      },
      {
        "answer": "Globen / Avicii Arena",
        "file": "File:Globen från Hammarbybacken, 2016a.jpg",
        "wiki": "sv:Avicii Arena"
      },
      {
        "answer": "Stockholms stadshus (City Hall)",
        "file": "File:Stockholms stadshus February 2026 02.jpg",
        "wiki": "sv:Stockholms stadshus"
      },
      {
        "answer": "Vasamuseet (Vasa Museum)",
        "file": "File:Vasamuseet 2008.jpg",
        "wiki": "sv:Vasamuseet"
      },
      {
        "answer": "Icehotel (Jukkasjärvi)",
        "file": "File:Main hall ICEHOTEL Sweden.jpg",
        "wiki": "sv:Icehotel"
      },
      {
        "answer": "Visby ringmur (Visby city wall)",
        "file": "File:Visby ringmur June 2026.jpg",
        "wiki": "sv:Visby ringmur"
      },
      {
        "answer": "Öresundsbron (Øresund Bridge)",
        "file": "File:Øresund Bridge from the air in September 2015.jpg",
        "wiki": "sv:Öresundsbron"
      },
      {
        "answer": "Ales stenar",
        "file": "File:Ales stenar 2015-3.jpg",
        "wiki": "sv:Ales stenar"
      },
      {
        "answer": "Kebnekaise",
        "file": "File:Kebnekaise viewed from Tarfala valley - narrower crop.jpg",
        "wiki": "sv:Kebnekaise"
      },
      {
        "answer": "Gamla stan (Stockholm)",
        "file": "File:Gamla stan February 2013 01.jpg",
        "wiki": "sv:Gamla stan"
      },
      {
        "answer": "Karlatornet (Gothenburg)",
        "file": "File:Karlatornet July 2025 02.jpg",
        "wiki": "sv:Karlatornet"
      },
      {
        "answer": "Liseberg (Gothenburg)",
        "file": "File:Liseberg, 20221223.jpg",
        "wiki": "sv:Liseberg"
      },
      {
        "answer": "Högakustenbron (High Coast Bridge)",
        "file": "File:Högakustenbron 12 juli 2024 Bild 6.jpg",
        "wiki": "sv:Högakustenbron"
      },
      {
        "answer": "Uppsala domkyrka (Uppsala Cathedral)",
        "file": "File:Uppsala domkyrka, flygbild (cropped).jpg",
        "wiki": "sv:Uppsala domkyrka"
      },
      {
        "answer": "Gröna Lund",
        "file": "File:Gröna Lund, 11 augusti 2024.jpg",
        "wiki": "sv:Gröna Lund"
      },
      {
        "answer": "Kiruna kyrka (Kiruna Church)",
        "file": "File:Church of Kiruna 2011.jpg",
        "wiki": "sv:Kiruna kyrka"
      },
      {
        "answer": "Stockholms slott (Royal Palace)",
        "file": "File:The Royal Palace (15891592359).jpg",
        "wiki": "sv:Stockholms slott"
      },
      {
        "answer": "Läckö slott",
        "file": "File:Läckö slott juli 2004.jpg",
        "wiki": "sv:Läckö slott"
      },
      {
        "answer": "Kalmar slott",
        "file": "File:Kalmar Slott Aug2011.jpg",
        "wiki": "sv:Kalmar slott"
      },
      {
        "answer": "Kaknästornet",
        "file": "File:Kaknästornet 2008x.jpg",
        "wiki": "sv:Kaknästornet"
      },
      {
        "answer": "Lunds domkyrka (Lund Cathedral)",
        "file": "File:Lund domkyrkan2007.jpg",
        "wiki": "sv:Lunds domkyrka"
      },
      {
        "answer": "Ölandsbron (Öland Bridge)",
        "file": "File:Ölandsbron augusti 2018.jpg",
        "wiki": "sv:Ölandsbron"
      },
      {
        "answer": "Smögen",
        "file": "File:Smögenbryggan 2009b.jpg",
        "wiki": "sv:Smögenbryggan"
      }
    ]
  },
  {
    "id": "sweden-nature",
    "title": {
      "en": "Swedish nature",
      "de": "Schwedens Natur",
      "sv": "Svensk natur"
    },
    "emoji": "🦌",
    "defaultMode": "tiles",
    "pictures": [
      {
        "answer": "Älg (moose)",
        "file": "File:Moose-Gustav.jpg",
        "wiki": "sv:Älg"
      },
      {
        "answer": "Ren (reindeer)",
        "file": "File:20070818-0001-strolling reindeer cropped.jpg",
        "wiki": "sv:Ren"
      },
      {
        "answer": "Lodjur (lynx)",
        "file": "File:Lynx lynx poing.jpg",
        "wiki": "sv:Lodjur"
      },
      {
        "answer": "Fjällräv (Arctic fox)",
        "file": "File:Arcticfox-3.jpg",
        "wiki": "sv:Fjällräv"
      },
      {
        "answer": "Järv (wolverine)",
        "file": "File:Järv1.jpg",
        "wiki": "sv:Järv"
      },
      {
        "answer": "Kungsörn (golden eagle)",
        "file": "File:Maakotka (Aquila chrysaetos) by Jarkko Järvinen (crop).jpg",
        "wiki": "sv:Kungsörn"
      },
      {
        "answer": "Kantarell (chanterelle)",
        "file": "File:Chanterelle Cantharellus cibarius.jpg",
        "wiki": "sv:Kantarell"
      },
      {
        "answer": "Hjortron (cloudberry)",
        "file": "File:Hjortron.png",
        "wiki": "sv:Hjortron"
      },
      {
        "answer": "Lingon (lingonberry)",
        "file": "File:Vaccinium vitis-idaea 20060824 003.jpg",
        "wiki": "sv:Lingon"
      },
      {
        "answer": "Blåbär (bilberry)",
        "file": "File:Blåbär, Blueberry.jpg",
        "wiki": "sv:Blåbär"
      },
      {
        "answer": "Brunbjörn (brown bear)",
        "file": "File:Brown bear (Ursus arctos arctos) running.jpg",
        "wiki": "sv:Brunbjörn"
      },
      {
        "answer": "Varg (wolf)",
        "file": "File:Front view of a resting Canis lupus ssp.jpg",
        "wiki": "sv:Varg"
      },
      {
        "answer": "Ekorre (red squirrel)",
        "file": "File:Kurre5.jpg",
        "wiki": "sv:Ekorre"
      },
      {
        "answer": "Igelkott (hedgehog)",
        "file": "File:Erinaceus europaeus LC0119.jpg",
        "wiki": "sv:Igelkott"
      },
      {
        "answer": "Gädda (pike)",
        "file": "File:Esox lucius ZOO 1.jpg",
        "wiki": "sv:Gädda"
      },
      {
        "answer": "Vitsippa (wood anemone)",
        "file": "File:Gullringskärrets naturreservat maj 2021e.jpg",
        "wiki": "sv:Vitsippa"
      },
      {
        "answer": "Liljekonvalj (lily of the valley)",
        "file": "File:Convallaria majalis - Köhler–s Medizinal-Pflanzen-045.jpg",
        "wiki": "sv:Liljekonvalj"
      },
      {
        "answer": "Blåsippa (liverleaf)",
        "file": "File:Hepatica nobilis flowers.JPG",
        "wiki": "sv:Blåsippa"
      },
      {
        "answer": "Norrsken (northern lights)",
        "file": "File:Aurora borealis over Eielson Air Force Base, Alaska.jpg",
        "wiki": "sv:Norrsken"
      },
      {
        "answer": "Lunnefågel (puffin)",
        "file": "File:Puffin (Fratercula arctica).jpg",
        "wiki": "sv:Lunnefågel"
      },
      {
        "answer": "Röd flugsvamp (fly agaric)",
        "file": "File:Röd flugsvamp.jpg",
        "wiki": "sv:Flugsvamp"
      },
      {
        "answer": "Kronhjort (red deer)",
        "file": "File:RedDeerStag.jpg",
        "wiki": "sv:Kronhjort"
      },
      {
        "answer": "Midnattssol (midnight sun)",
        "file": "File:Midnight sun.jpg",
        "wiki": "en:Midnight sun"
      }
    ]
  },
  {
    "id": "sweden-food",
    "title": {
      "en": "Swedish food & fika",
      "de": "Schwedisches Essen & Fika",
      "sv": "Fika & husmanskost"
    },
    "emoji": "🥐",
    "defaultMode": "blur",
    "pictures": [
      {
        "answer": "Kanelbulle (cinnamon bun)",
        "file": "File:Kanelbulle.jpg",
        "wiki": "sv:Kanelbulle"
      },
      {
        "answer": "Semla",
        "file": "File:Semla 2026 01.jpg",
        "wiki": "sv:Semla"
      },
      {
        "answer": "Prinsesstårta (princess cake)",
        "file": "File:Prinsesstårta.JPG",
        "wiki": "sv:Prinsesstårta"
      },
      {
        "answer": "Kladdkaka (sticky chocolate cake)",
        "file": "File:Kladdkaka-med-vispgradde.jpg",
        "wiki": "sv:Kladdkaka"
      },
      {
        "answer": "Dammsugare / punschrulle",
        "file": "File:Dammsugare.JPG",
        "wiki": "sv:Dammsugare (bakverk)"
      },
      {
        "answer": "Lussekatt (saffron bun)",
        "file": "File:Lussebullar.jpg",
        "wiki": "sv:Lussekatt"
      },
      {
        "answer": "Köttbullar (meatballs)",
        "file": "File:Kottbullar.jpg",
        "wiki": "sv:Köttbullar"
      },
      {
        "answer": "Janssons frestelse",
        "file": "File:Janssons frestelse.jpg",
        "wiki": "sv:Janssons frestelse"
      },
      {
        "answer": "Gravad lax (gravlax)",
        "file": "File:Gravlax.jpg",
        "wiki": "sv:Gravad lax"
      },
      {
        "answer": "Smörgåstårta (sandwich cake)",
        "file": "File:00 Smörgåstårta.jpg",
        "wiki": "sv:Smörgåstårta"
      },
      {
        "answer": "Knäckebröd (crispbread)",
        "file": "File:Knaeckebroed.jpg",
        "wiki": "sv:Knäckebröd"
      },
      {
        "answer": "Surströmming (fermented herring)",
        "file": "File:Surströmming.jpg",
        "wiki": "sv:Surströmming"
      },
      {
        "answer": "Inlagd sill (pickled herring)",
        "file": "File:Sillar.jpg",
        "wiki": "sv:Inlagd sill"
      },
      {
        "answer": "Pyttipanna",
        "file": "File:Pyttipannu.jpg",
        "wiki": "sv:Pyttipanna"
      },
      {
        "answer": "Falukorv",
        "file": "File:Falukorv.jpg",
        "wiki": "sv:Falukorv"
      },
      {
        "answer": "Tunnbrödsrulle",
        "file": "File:Tunnbrödsrulle.jpg",
        "wiki": "sv:Tunnbrödsrulle"
      },
      {
        "answer": "Ostkaka (Swedish cheesecake)",
        "file": "File:Ostkaka.jpg",
        "wiki": "sv:Ostkaka"
      },
      {
        "answer": "Polkagris (candy cane)",
        "file": "File:Flickr - cyclonebill - Polkagris.jpg",
        "wiki": "sv:Polkagris"
      },
      {
        "answer": "Ärtsoppa (pea soup)",
        "file": "File:Ärtsoppa och pannkakor.jpg",
        "wiki": "sv:Ärtsoppa"
      },
      {
        "answer": "Raggmunk (potato pancake)",
        "file": "File:Raggmunk med fläsk.jpg",
        "wiki": "sv:Raggmunk"
      },
      {
        "answer": "Kroppkakor",
        "file": "File:Kroppkaka.jpg",
        "wiki": "sv:Kroppkakor"
      },
      {
        "answer": "Pepparkakor (gingerbread)",
        "file": "File:Freshly baked gingerbread - Christmas 2004.jpg",
        "wiki": "sv:Pepparkaka"
      },
      {
        "answer": "Kräftor (crayfish)",
        "file": "File:Astacus astacus male.jpg",
        "wiki": "sv:Kräftor"
      }
    ]
  },
  {
    "id": "sweden-traditions",
    "title": {
      "en": "Swedish traditions",
      "de": "Schwedische Traditionen",
      "sv": "Svenska traditioner"
    },
    "emoji": "🌼",
    "defaultMode": "spotlight",
    "pictures": [
      {
        "answer": "Midsommarstång (maypole)",
        "file": "File:Mittsommer-skansen.jpg",
        "wiki": "sv:Midsommarstång"
      },
      {
        "answer": "Kräftskiva (crayfish party)",
        "file": "File:Kräftskiva, Häringe slott, 1991.jpg",
        "wiki": "sv:Kräftskiva"
      },
      {
        "answer": "Luciatåg (Lucia procession)",
        "file": "File:SanktaLuciaProcession.jpg",
        "wiki": "sv:Luciatåg"
      },
      {
        "answer": "Påskris (Easter twigs)",
        "file": "File:Påsk 2019.jpg",
        "wiki": "sv:Påskris"
      },
      {
        "answer": "Valborg (bonfire night)",
        "file": "File:Valborg 2182 (6989903410).jpg",
        "wiki": "sv:Valborgsmässoafton"
      },
      {
        "answer": "Dalahäst (Dala horse)",
        "file": "File:Dalecarlian horse.jpg",
        "wiki": "sv:Dalahäst"
      },
      {
        "answer": "Nationaldagen (6 June)",
        "file": "File:National Day of Sweden 2016 12.jpg",
        "wiki": "sv:Sveriges nationaldag"
      },
      {
        "answer": "Julbord (Christmas buffet)",
        "file": "File:Carl Larsson julbord 1904.jpg",
        "wiki": "sv:Julbord"
      },
      {
        "answer": "Gävlebocken (Gävle goat)",
        "file": "File:Gavle goat 2019.jpg",
        "wiki": "sv:Gävlebocken"
      },
      {
        "answer": "Fika",
        "file": "File:Fika latte.jpg",
        "wiki": "sv:Fika"
      },
      {
        "answer": "Adventsljusstake (advent candles)",
        "file": "File:Adventsljusstake med tre brinnande ljus.JPG",
        "wiki": "sv:Adventsljusstake"
      },
      {
        "answer": "Snaps / nubbe",
        "file": "File:Snaps at a sittning (brightened).jpg",
        "wiki": "sv:Snaps"
      },
      {
        "answer": "Vasaloppet",
        "file": "File:Jørgen Aukland Vasaloppet 2013 001.jpg",
        "wiki": "sv:Vasaloppet"
      },
      {
        "answer": "Studenten (graduation)",
        "file": "File:Studentmössa och studentdocka.jpg",
        "wiki": "sv:Studenten"
      }
    ]
  },
  {
    "id": "sweden-music",
    "title": {
      "en": "Swedish music",
      "de": "Schwedische Musik",
      "sv": "Svensk musik"
    },
    "emoji": "🎤",
    "defaultMode": "pixelate",
    "pictures": [
      {
        "answer": "Loreen",
        "file": "File:Loreen - Melodifestivalen 2023, Malmö 118 (cropped).jpg",
        "wiki": "en:Loreen (singer)"
      },
      {
        "answer": "Måns Zelmerlöw",
        "file": "File:Melodifestivalen 2025 deltävling 4 Malmö Måns Zelmerlöw presentation 03.jpg",
        "wiki": "en:Måns Zelmerlöw"
      },
      {
        "answer": "Carola",
        "file": "File:Carola Häggkvist in June 2015-3.jpg",
        "wiki": "en:Carola Häggkvist"
      },
      {
        "answer": "Robyn",
        "file": "File:Robyn face.jpg",
        "wiki": "en:Robyn"
      },
      {
        "answer": "Avicii",
        "file": "File:Avicii 2014 003cr.jpg",
        "wiki": "en:Avicii"
      },
      {
        "answer": "Zara Larsson",
        "file": "File:Zara Larsson Midnight Sun European Tour (cropped) (cropped).jpg",
        "wiki": "en:Zara Larsson"
      },
      {
        "answer": "Roxette",
        "file": "File:Roxette at the Beacon, September 2012.jpg",
        "wiki": "en:Roxette"
      },
      {
        "answer": "Europe",
        "file": "File:Europe live in Tønsberg 2025 (cropped).jpg",
        "wiki": "en:Europe (band)"
      },
      {
        "answer": "First Aid Kit",
        "file": "File:Coachella18W1-208 (42057786281).jpg",
        "wiki": "en:First Aid Kit (band)"
      },
      {
        "answer": "Max Martin",
        "file": "File:MaxMartin.jpg",
        "wiki": "en:Max Martin"
      },
      {
        "answer": "Tove Lo",
        "file": "File:Tove Lo (2) By Daniel Åhs Karlsson.jpeg",
        "wiki": "en:Tove Lo"
      },
      {
        "answer": "Lykke Li",
        "file": "File:Lykke Li 4.jpg",
        "wiki": "en:Lykke Li"
      },
      {
        "answer": "The Cardigans",
        "file": "File:CardigansHamm071218-39 (32384726568).jpg",
        "wiki": "en:The Cardigans"
      },
      {
        "answer": "José González",
        "file": "File:POS17 @Kristsll-640 (36005372005) (cropped).jpg",
        "wiki": "en:José González (singer)"
      },
      {
        "answer": "Sabaton",
        "file": "File:Hellfest2017Sabaton 01.jpg",
        "wiki": "en:Sabaton (band)"
      },
      {
        "answer": "Charlotte Perrelli",
        "file": "File:Charlotte Perrelli, Melodifestivalen 2017 (cropped).jpg",
        "wiki": "en:Charlotte Perrelli"
      },
      {
        "answer": "Cornelia Jakobs",
        "file": "File:Cornelia Jakobs - Melodifestivalen 2022, finalen, torsdagen 114.jpg",
        "wiki": "en:Cornelia Jakobs"
      },
      {
        "answer": "Danny Saucedo",
        "file": "File:Danny Saucedo - Melodifestivalen 2024-3.jpg",
        "wiki": "en:Danny Saucedo"
      },
      {
        "answer": "Ghost",
        "file": "File:2023 Sweden Rock - 4309 (53048871172).jpg",
        "wiki": "en:Ghost (Swedish band)"
      },
      {
        "answer": "Laleh",
        "file": "File:Laleh promotional photo in 2016.jpg",
        "wiki": "en:Laleh (singer)"
      },
      {
        "answer": "Veronica Maggio",
        "file": "File:Veronica Maggio - Homecoming Festival-4 (cropped).jpg",
        "wiki": "en:Veronica Maggio"
      },
      {
        "answer": "ABBA",
        "file": "File:ABBA - TopPop 1974 5.png",
        "wiki": "sv:ABBA"
      },
      {
        "answer": "Ace of Base",
        "file": "File:Aob tour.jpg",
        "wiki": "sv:Ace of Base"
      },
      {
        "answer": "Swedish House Mafia",
        "file": "File:Swedish house mafia 2.jpg",
        "wiki": "sv:Swedish House Mafia"
      }
    ]
  },
  {
    "id": "sweden-people",
    "title": {
      "en": "Famous Swedes",
      "de": "Berühmte Schweden",
      "sv": "Kända svenskar"
    },
    "emoji": "👑",
    "defaultMode": "pixelate",
    "pictures": [
      {
        "answer": "Zlatan Ibrahimović",
        "file": "File:Zlatan Ibrahimović nyc.jpg",
        "wiki": "en:Zlatan Ibrahimović"
      },
      {
        "answer": "Ingmar Bergman",
        "file": "File:Ingmar Bergman (1966).jpg",
        "wiki": "en:Ingmar Bergman"
      },
      {
        "answer": "Alfred Nobel",
        "file": "File:Alfred Nobel3.jpg",
        "wiki": "en:Alfred Nobel"
      },
      {
        "answer": "Björn Borg",
        "file": "File:Bjorn Borg en 2014.jpg",
        "wiki": "en:Björn Borg"
      },
      {
        "answer": "Annika Sörenstam",
        "file": "File:2008 LPGA Championship - Annika Sorenstam tee shot.jpg",
        "wiki": "en:Annika Sörenstam"
      },
      {
        "answer": "Alicia Vikander",
        "file": "File:Alicia Vikander at the 83rd Venice International Film Festival “The Echo Chamber” premiere.jpg",
        "wiki": "en:Alicia Vikander"
      },
      {
        "answer": "Ingvar Kamprad",
        "file": "File:Ingvar Kamprad Haparanda June 2010.jpg",
        "wiki": "en:Ingvar Kamprad"
      },
      {
        "answer": "Daniel Ek",
        "file": "File:Daniel Ek EC 2025 (cropped).jpg",
        "wiki": "en:Daniel Ek"
      },
      {
        "answer": "Carl XVI Gustaf",
        "file": "File:06.11.2025 – Recepção Oficial dos Chefes de Delegação da Cúpula do Clima (54906269035) (Carlos XVI Gustavo).jpg",
        "wiki": "en:Carl XVI Gustaf"
      },
      {
        "answer": "Kronprinsessan Victoria",
        "file": "File:2025-11-18 Event, Besuch der Kronprinzessin Victoria von Schweden beim deutschen Bundespräsidenten Frank-Walter Steinmeier im November 2025 STP 9817-2.jpg",
        "wiki": "en:Victoria, Crown Princess of Sweden"
      },
      {
        "answer": "Greta Garbo",
        "file": "File:Garbo in Inspiration.jpg",
        "wiki": "en:Greta Garbo"
      },
      {
        "answer": "Ingrid Bergman",
        "file": "File:Ingrid Bergman by Whitey Schafer 1940.jpg",
        "wiki": "en:Ingrid Bergman"
      },
      {
        "answer": "Dag Hammarskjöld",
        "file": "File:Dag Hammarskjöld.jpg",
        "wiki": "en:Dag Hammarskjöld"
      },
      {
        "answer": "Stellan Skarsgård",
        "file": "File:Stellan Skarsgård-9707 (cropped).jpg",
        "wiki": "en:Stellan Skarsgård"
      },
      {
        "answer": "Sarah Sjöström",
        "file": "File:Sarah Sjöström 2013 (cropped).jpg",
        "wiki": "en:Sarah Sjöström"
      },
      {
        "answer": "Armand \"Mondo\" Duplantis",
        "file": "File:Armand Duplantis wins the Pole Vault at the 2026 Wanda Diamond League’s Weltklasse Zürich athletics competition.jpg",
        "wiki": "en:Armand Duplantis"
      },
      {
        "answer": "Henrik Lundqvist",
        "file": "File:Henrik Lundqvist by Gage Skidmore.jpg",
        "wiki": "en:Henrik Lundqvist"
      },
      {
        "answer": "PewDiePie (Felix Kjellberg)",
        "file": "File:Pewdiepie head shot.jpg",
        "wiki": "en:PewDiePie"
      },
      {
        "answer": "Greta Thunberg",
        "file": "File:Greta Thunberg in May 2026 (cropped 3x4).jpg",
        "wiki": "en:Greta Thunberg"
      },
      {
        "answer": "Astrid Lindgren",
        "file": "File:Lindgren 1960.jpg",
        "wiki": "sv:Astrid Lindgren"
      },
      {
        "answer": "Carl von Linné",
        "file": "File:Carl von Linné.jpg",
        "wiki": "sv:Carl von Linné"
      },
      {
        "answer": "Olof Palme",
        "file": "File:Olof Palme - Alvin (239694).jpg",
        "wiki": "sv:Olof Palme"
      },
      {
        "answer": "Selma Lagerlöf",
        "file": "File:Atelje Jaeger - Selma Lagerlöf 1928.jpeg",
        "wiki": "sv:Selma Lagerlöf"
      }
    ]
  },
  {
    "id": "sweden-childhood",
    "title": {
      "en": "Swedish childhood",
      "de": "Schwedische Kindheit",
      "sv": "Barndom"
    },
    "emoji": "🧸",
    "defaultMode": "zoom",
    "pictures": [
      {
        "answer": "Pippi Långstrump",
        "file": "File:Pippi Longstocking.jpg",
        "wiki": "sv:Pippi Långstrump"
      },
      {
        "answer": "Emil i Lönneberga",
        "file": "File:Emil and pig, Astrid Lindgrens Värld 2014.jpg",
        "wiki": "sv:Emil i Lönneberga"
      },
      {
        "answer": "Bamse",
        "file": "File:Bamse.jpg",
        "wiki": "sv:Bamse"
      },
      {
        "answer": "Pettson och Findus",
        "file": "File:Pettson och Findus.JPG",
        "wiki": "sv:Pettson och Findus"
      },
      {
        "answer": "Bolibompa",
        "file": "File:Bolibompadraken.jpeg",
        "wiki": "sv:Bolibompa"
      },
      {
        "answer": "Ronja Rövardotter",
        "file": "File:Ronja och Mattis, Astrid Lindgrens Värld 2014.jpg",
        "wiki": "sv:Ronja Rövardotter"
      },
      {
        "answer": "Bröderna Lejonhjärta",
        "file": "File:Astrid Lindgrens Värld - Bröderna Lejonhjärta.jpg",
        "wiki": "sv:Bröderna Lejonhjärta"
      },
      {
        "answer": "Nils Holgersson",
        "file": "File:Nils Holgersson band 1-Illustration 1.jpg",
        "wiki": "sv:Nils Holgerssons underbara resa genom Sverige"
      },
      {
        "answer": "Mamma Mu",
        "file": "File:Mamma-mu-och-krakan.jpg",
        "wiki": "sv:Mamma Mu"
      },
      {
        "answer": "Astrid Lindgrens värld",
        "file": "File:Astrid Lindgrens Värld - Entré.jpg",
        "wiki": "sv:Astrid Lindgrens värld"
      },
      {
        "answer": "Junibacken",
        "file": "File:Junibacken 2007.jpg",
        "wiki": "sv:Junibacken"
      },
      {
        "answer": "Villa Villekulla",
        "file": "File:Villa villekulla.jpg",
        "wiki": "sv:Villa Villekulla"
      }
    ]
  }
];
