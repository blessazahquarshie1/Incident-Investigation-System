import type { Person } from '../types';

export const persons: Person[] = [
  {
    "id": "P-001",
    "fullName": "Kwame Asante",
    "type": "suspect",
    "phone": "0240000001",
    "address": "14 Independence Ave, Ridge, Accra",
    "relatedCases": [
      "CASE-00123"
    ]
  },
  {
    "id": "P-002",
    "fullName": "Kofi Boateng",
    "type": "suspect",
    "address": "Plot 8, Heavy Industrial Area, Tema",
    "knownAliases": [
      "Kojo B"
    ],
    "relatedCases": [
      "CASE-00123",
      "CASE-00201"
    ]
  },
  {
    "id": "P-003",
    "fullName": "Yaw Osei",
    "type": "person-of-interest",
    "phone": "0243333333",
    "address": "22 Ring Road Central, Kokomlemle, Accra",
    "relatedCases": [
      "CASE-00001"
    ]
  },
  {
    "id": "P-004",
    "fullName": "Ama Boateng",
    "type": "victim",
    "phone": "0242222222",
    "address": "Block B, Flat 4, Cantonments, Accra",
    "relatedCases": [
      "CASE-00022"
    ]
  },
  {
    "id": "P-005",
    "fullName": "Abena Manu",
    "type": "victim",
    "phone": "0205555555",
    "address": "House 12, Kasoa New Market Rd, Kasoa",
    "relatedCases": [
      "CASE-00031"
    ]
  },
  {
    "id": "P-006",
    "fullName": "Kojo Antwi",
    "type": "suspect",
    "phone": "0246666666",
    "address": "57 Liberation Rd, Airport Residential Area, Accra",
    "relatedCases": [
      "CASE-00001"
    ]
  },
  {
    "id": "P-007",
    "fullName": "Kofi Agyei",
    "type": "witness",
    "phone": "0240000002",
    "address": "18 High Street, Jamestown, Accra",
    "relatedCases": [
      "CASE-00123"
    ]
  },
  {
    "id": "P-008",
    "fullName": "Person 8",
    "type": "witness",
    "phone": "0248888888",
    "address": "Plot 14, Commercial District, Cape Coast",
    "relatedCases": []
  },
  {
    "id": "P-009",
    "fullName": "Person 9",
    "type": "witness",
    "phone": "0249999999",
    "address": "24 Harper Road, Adum, Kumasi",
    "relatedCases": []
  },
  {
    "id": "P-010",
    "fullName": "Person 10",
    "type": "witness",
    "phone": "0241010101",
    "address": "Plot 3, Beach Road, Takoradi",
    "relatedCases": []
  },
  {
    "id": "P-011",
    "fullName": "Person 11",
    "type": "witness",
    "phone": "0241122334",
    "address": "House 8, Community 1, Tema",
    "relatedCases": []
  },
  {
    "id": "P-012",
    "fullName": "Person 12",
    "type": "witness",
    "phone": "0242233445",
    "address": "45 Spintex Road, Baatsona, Accra",
    "relatedCases": []
  },
  {
    "id": "P-013",
    "fullName": "Person 13",
    "type": "witness",
    "phone": "0243344556",
    "address": "12 Market Circle, Takoradi",
    "relatedCases": []
  },
  {
    "id": "P-014",
    "fullName": "Person 14",
    "type": "witness",
    "phone": "0244455667",
    "address": "Plot 19, Sunyani Road, Kumasi",
    "relatedCases": []
  },
  {
    "id": "P-015",
    "fullName": "Person 15",
    "type": "witness",
    "phone": "0245566778",
    "address": "8 Castle Road, Osu, Accra",
    "relatedCases": []
  },
  {
    "id": "P-016",
    "fullName": "Person 16",
    "type": "witness",
    "phone": "0246677889",
    "address": "House 5, New Winneba Rd, Kasoa",
    "relatedCases": []
  },
  {
    "id": "P-017",
    "fullName": "Person 17",
    "type": "witness",
    "phone": "0247788990",
    "address": "15 Oxford Street, Osu, Accra",
    "relatedCases": []
  },
  {
    "id": "P-018",
    "fullName": "Person 18",
    "type": "witness",
    "phone": "0248899001",
    "address": "Plot 22, Industrial Estate, Tema",
    "relatedCases": []
  },
  {
    "id": "P-019",
    "fullName": "Person 19",
    "type": "witness",
    "phone": "0249900112",
    "address": "33 Prempeh II Ave, Kumasi",
    "relatedCases": []
  },
  {
    "id": "P-020",
    "fullName": "Person 20",
    "type": "witness",
    "phone": "0201122334",
    "address": "House 17, Harbour View, Takoradi",
    "relatedCases": []
  },
  {
    "id": "P-021",
    "fullName": "Person 21",
    "type": "witness",
    "phone": "0202233445",
    "address": "10 Victoria Road, Cape Coast",
    "relatedCases": []
  },
  {
    "id": "P-022",
    "fullName": "Person 22",
    "type": "witness",
    "phone": "0203344556",
    "address": "Plot 6, Dansoman High St, Accra",
    "relatedCases": []
  },
  {
    "id": "P-023",
    "fullName": "Person 23",
    "type": "witness",
    "phone": "0204455667",
    "address": "52 Graphic Road, South Industrial Area, Accra",
    "relatedCases": []
  },
  {
    "id": "P-024",
    "fullName": "Person 24",
    "type": "witness",
    "phone": "0205566778",
    "address": "House 9, Community 5, Tema",
    "relatedCases": []
  },
  {
    "id": "P-025",
    "fullName": "Person 25",
    "type": "witness",
    "phone": "0206677889",
    "address": "Plot 31, Bantama High St, Kumasi",
    "relatedCases": []
  },
  {
    "id": "P-026",
    "fullName": "Person 26",
    "type": "witness",
    "phone": "0207788990",
    "address": "14 Giffard Road, East Cantonments, Accra",
    "relatedCases": []
  },
  {
    "id": "P-027",
    "fullName": "Kweku Baah",
    "type": "victim",
    "phone": "0201234567",
    "address": "Opposite Kasoa New Market, Kasoa",
    "relatedCases": [
      "CASE-00201"
    ]
  },
  {
    "id": "P-028",
    "fullName": "Emmanuel Tetteh",
    "type": "witness",
    "phone": "0207654321",
    "address": "Ofankor Barrier, Greater Accra",
    "relatedCases": [
      "CASE-00201"
    ]
  },
  {
    "id": "P-029",
    "fullName": "Selorm Agbenu",
    "type": "victim",
    "phone": "0551122334",
    "address": "12 Volta Street, Dzorwulu, Accra",
    "relatedCases": [
      "CASE-00202"
    ]
  },
  {
    "id": "P-030",
    "fullName": "Fafali Dogbe",
    "type": "witness",
    "phone": "0559988776",
    "address": "Apenkwa, Achimota, Accra",
    "relatedCases": [
      "CASE-00202"
    ]
  },
  {
    "id": "P-031",
    "fullName": "Kwame Asante",
    "type": "suspect",
    "phone": "0541234001",
    "address": "Osu RE, Accra",
    "relatedCases": [
      "CASE-00203"
    ]
  },
  {
    "id": "P-032",
    "fullName": "Esi Asante",
    "type": "person-of-interest",
    "phone": "0243334444",
    "address": "Ringway Estate, Osu, Accra",
    "relatedCases": [
      "CASE-00203"
    ]
  },
  {
    "id": "P-033",
    "fullName": "Daniel Cudjoe",
    "type": "suspect",
    "phone": "0208889999",
    "address": "Salvation Army St, Osu, Accra",
    "knownAliases": [
      "Kojo B"
    ],
    "relatedCases": [
      "CASE-00203"
    ]
  },
  {
    "id": "P-034",
    "fullName": "Akua Agyemang",
    "type": "victim",
    "phone": "0241111111",
    "address": "Oxford Street Commercial strip, Osu, Accra",
    "relatedCases": [
      "CASE-00203",
      "CASE-00123"
    ]
  },
  {
    "id": "P-035",
    "fullName": "Fiifi Quaye",
    "type": "suspect",
    "phone": "0544556677",
    "address": "New Takoradi, Takoradi",
    "relatedCases": [
      "CASE-00204"
    ]
  },
  {
    "id": "P-036",
    "fullName": "Araba Hanson",
    "type": "victim",
    "phone": "0549887766",
    "address": "Market Circle Commercial Block, Takoradi",
    "relatedCases": [
      "CASE-00204"
    ]
  }
];
