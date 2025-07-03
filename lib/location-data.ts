export interface Country {
  code: string
  name: string
  states: State[]
}

export interface State {
  code: string
  name: string
  cities: string[]
}

// Sample location data - in a real app, you'd fetch this from an API
export const locationData: Country[] = [
  {
    code: "NG",
    name: "Nigeria",
    states: [
      {
        code: "LA",
        name: "Lagos",
        cities: ["Lagos Island", "Ikeja", "Surulere", "Victoria Island", "Ikoyi", "Lekki", "Alaba", "Mushin"],
      },
      {
        code: "AB",
        name: "Abuja",
        cities: ["Garki", "Wuse", "Maitama", "Asokoro", "Gwarinpa", "Kubwa"],
      },
      {
        code: "KN",
        name: "Kano",
        cities: ["Kano Metropolitan", "Fagge", "Dala", "Gwale", "Tarauni", "Nassarawa"],
      },
      {
        code: "PH",
        name: "Port Harcourt",
        cities: ["Port Harcourt City", "Obio-Akpor", "Eleme", "Ikwerre", "Oyigbo"],
      },
      {
        code: "ED",
        name: "Edo",
        cities: ["Benin City", "Auchi", "Ekpoma", "Uromi", "Igarra"],
      },
      {
        code: "DT",
        name: "Delta",
        cities: ["Warri", "Asaba", "Sapele", "Ughelli", "Agbor", "Ozoro"],
      },
    ],
  },
  {
    code: "US",
    name: "United States",
    states: [
      {
        code: "NY",
        name: "New York",
        cities: ["New York City", "Buffalo", "Rochester", "Syracuse", "Albany", "Yonkers"],
      },
      {
        code: "CA",
        name: "California",
        cities: ["Los Angeles", "San Francisco", "San Diego", "Sacramento", "Oakland", "Fresno"],
      },
      {
        code: "TX",
        name: "Texas",
        cities: ["Houston", "Dallas", "Austin", "San Antonio", "Fort Worth", "El Paso"],
      },
      {
        code: "FL",
        name: "Florida",
        cities: ["Miami", "Orlando", "Tampa", "Jacksonville", "Fort Lauderdale", "Tallahassee"],
      },
    ],
  },
  {
    code: "GB",
    name: "United Kingdom",
    states: [
      {
        code: "ENG",
        name: "England",
        cities: ["London", "Manchester", "Birmingham", "Liverpool", "Leeds", "Sheffield"],
      },
      {
        code: "SCT",
        name: "Scotland",
        cities: ["Edinburgh", "Glasgow", "Aberdeen", "Dundee", "Stirling"],
      },
      {
        code: "WLS",
        name: "Wales",
        cities: ["Cardiff", "Swansea", "Newport", "Wrexham", "Barry"],
      },
    ],
  },
  {
    code: "CA",
    name: "Canada",
    states: [
      {
        code: "ON",
        name: "Ontario",
        cities: ["Toronto", "Ottawa", "Hamilton", "London", "Windsor", "Kitchener"],
      },
      {
        code: "QC",
        name: "Quebec",
        cities: ["Montreal", "Quebec City", "Laval", "Gatineau", "Longueuil"],
      },
      {
        code: "BC",
        name: "British Columbia",
        cities: ["Vancouver", "Victoria", "Surrey", "Burnaby", "Richmond"],
      },
    ],
  },
]

export function getCountries(): Country[] {
  return locationData
}

export function getStatesByCountry(countryCode: string): State[] {
  const country = locationData.find((c) => c.code === countryCode)
  return country?.states || []
}

export function getCitiesByState(countryCode: string, stateCode: string): string[] {
  const country = locationData.find((c) => c.code === countryCode)
  const state = country?.states.find((s) => s.code === stateCode)
  return state?.cities || []
}
