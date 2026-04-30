/**
 * Pakistan administrative divisions → cities lookup.
 * Used for province → city cascading pickers across the app.
 */

export interface ProvinceData {
  name: string;
  nameUr: string;
  cities: string[];
}

export const PROVINCES: ProvinceData[] = [
  {
    name: "Punjab",
    nameUr: "پنجاب",
    cities: [
      "Lahore", "Rawalpindi", "Faisalabad", "Multan", "Gujranwala",
      "Sialkot", "Sargodha", "Bahawalpur", "Sahiwal", "Sheikhupura",
      "Gujrat", "Rahim Yar Khan", "Jhang", "Jhelum", "Kasur",
      "Okara", "Dera Ghazi Khan", "Mianwali", "Chiniot", "Khanewal",
      "Muzaffargarh", "Vehari", "Attock", "Hafizabad", "Mandi Bahauddin",
      "Toba Tek Singh", "Pakpattan", "Narowal", "Nankana Sahib",
      "Chakwal", "Bhakkar", "Lodhran", "Layyah", "Rajanpur",
      "Khushab",
    ],
  },
  {
    name: "Sindh",
    nameUr: "سندھ",
    cities: [
      "Karachi", "Hyderabad", "Sukkur", "Larkana", "Nawabshah",
      "Mirpur Khas", "Jacobabad", "Shikarpur", "Khairpur", "Dadu",
      "Thatta", "Badin", "Tando Adam", "Tando Allahyar", "Umerkot",
      "Ghotki", "Sanghar", "Kambar Shahdadkot", "Matiari", "Tharparkar",
      "Jamshoro",
    ],
  },
  {
    name: "Khyber Pakhtunkhwa",
    nameUr: "خیبر پختونخوا",
    cities: [
      "Peshawar", "Mardan", "Mingora", "Kohat", "Abbottabad",
      "Mansehra", "Nowshera", "Charsadda", "Bannu", "Dera Ismail Khan",
      "Swabi", "Haripur", "Karak", "Lakki Marwat", "Tank",
      "Hangu", "Batagram", "Buner", "Chitral", "Lower Dir",
      "Upper Dir", "Shangla", "Tor Ghar",
    ],
  },
  {
    name: "Balochistan",
    nameUr: "بلوچستان",
    cities: [
      "Quetta", "Turbat", "Khuzdar", "Chaman", "Hub",
      "Gwadar", "Zhob", "Sibi", "Dera Murad Jamali", "Loralai",
      "Mastung", "Pishin", "Kalat", "Nushki", "Dalbandin",
      "Dera Bugti", "Kohlu", "Ziarat",
    ],
  },
  {
    name: "Islamabad Capital Territory",
    nameUr: "اسلام آباد",
    cities: ["Islamabad"],
  },
  {
    name: "Azad Jammu & Kashmir",
    nameUr: "آزاد جموں و کشمیر",
    cities: [
      "Muzaffarabad", "Mirpur", "Bhimber", "Kotli", "Rawalakot",
      "Bagh", "Pallandri", "Hajira", "Sudhanoti",
    ],
  },
  {
    name: "Gilgit-Baltistan",
    nameUr: "گلگت بلتستان",
    cities: [
      "Gilgit", "Skardu", "Chilas", "Hunza", "Ghanche",
      "Astore", "Diamer", "Kharmang",
    ],
  },
];

/** Flat list of all cities for simple search. */
export const ALL_CITIES: string[] = PROVINCES.flatMap((p) => p.cities).sort();

/** Get province name from a city name. */
export function getProvinceForCity(city: string): string | undefined {
  return PROVINCES.find((p) => p.cities.includes(city))?.name;
}
