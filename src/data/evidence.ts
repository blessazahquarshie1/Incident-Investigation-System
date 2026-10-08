import type { Evidence } from '../types';

export const evidence: Evidence[] = [
  {
    "id": "E-024",
    "caseId": "CASE-00123",
    "type": "device",
    "description": "Laptop found at scene",
    "collectedAt": "2026-09-14T09:30:00Z",
    "collectedBy": "O-001",
    "locationId": "L-001",
    "linkedPersons": [
      "P-001"
    ],
    "title": "Laptop",
    "status": "under-analysis",
    "custodyHistory": [
      {
        "id": "CE-024-1",
        "action": "collected",
        "timestamp": "2026-09-14T09:30:00Z",
        "officerId": "O-001"
      },
      {
        "id": "CE-024-2",
        "action": "transferred",
        "timestamp": "2026-09-14T10:45:00Z",
        "officerId": "O-001",
        "toOfficerId": "O-002"
      },
      {
        "id": "CE-024-3",
        "action": "submitted-to-evidence-room",
        "timestamp": "2026-09-14T14:12:00Z",
        "officerId": "O-002"
      },
      {
        "id": "CE-024-4",
        "action": "analysis-started",
        "timestamp": "2026-09-14T16:00:00Z",
        "officerId": "O-003"
      }
    ]
  },
  {
    "id": "E-031",
    "caseId": "CASE-00123",
    "type": "document",
    "description": "Old document",
    "collectedAt": "2026-09-10T09:30:00Z",
    "collectedBy": "O-001",
    "locationId": "L-001",
    "linkedPersons": [],
    "title": "Old Doc",
    "status": "destroyed",
    "custodyHistory": [
      {
        "id": "CE-031-1",
        "action": "destroyed",
        "timestamp": "2026-09-10T10:00:00Z",
        "officerId": "O-001"
      }
    ]
  },
  {
    "id": "E-001",
    "caseId": "CASE-00001",
    "type": "photo",
    "description": "Photo",
    "collectedAt": "2026-01-01T00:00:00Z",
    "collectedBy": "O-001",
    "title": "Photo 1",
    "status": "collected",
    "linkedPersons": [],
    "custodyHistory": [
      {
        "id": "CE-1-1",
        "action": "collected",
        "timestamp": "2026-01-01T00:00:00Z",
        "officerId": "O-001"
      }
    ]
  },
  {
    "id": "E-002",
    "caseId": "CASE-00001",
    "type": "photo",
    "description": "Photo",
    "collectedAt": "2026-01-01T00:00:00Z",
    "collectedBy": "O-001",
    "title": "Photo 2",
    "status": "collected",
    "linkedPersons": [],
    "custodyHistory": [
      {
        "id": "CE-2-1",
        "action": "collected",
        "timestamp": "2026-01-01T00:00:00Z",
        "officerId": "O-001"
      }
    ]
  },
  {
    "id": "E-003",
    "caseId": "CASE-00001",
    "type": "photo",
    "description": "Photo",
    "collectedAt": "2026-01-01T00:00:00Z",
    "collectedBy": "O-001",
    "title": "Photo 3",
    "status": "collected",
    "linkedPersons": [],
    "custodyHistory": [
      {
        "id": "CE-3-1",
        "action": "collected",
        "timestamp": "2026-01-01T00:00:00Z",
        "officerId": "O-001"
      }
    ]
  },
  {
    "id": "E-004",
    "caseId": "CASE-00001",
    "type": "photo",
    "description": "Photo",
    "collectedAt": "2026-01-01T00:00:00Z",
    "collectedBy": "O-001",
    "title": "Photo 4",
    "status": "collected",
    "linkedPersons": [],
    "custodyHistory": [
      {
        "id": "CE-4-1",
        "action": "collected",
        "timestamp": "2026-01-01T00:00:00Z",
        "officerId": "O-001"
      }
    ]
  },
  {
    "id": "E-005",
    "caseId": "CASE-00001",
    "type": "photo",
    "description": "Photo",
    "collectedAt": "2026-01-01T00:00:00Z",
    "collectedBy": "O-001",
    "title": "Photo 5",
    "status": "collected",
    "linkedPersons": [],
    "custodyHistory": [
      {
        "id": "CE-5-1",
        "action": "collected",
        "timestamp": "2026-01-01T00:00:00Z",
        "officerId": "O-001"
      }
    ]
  },
  {
    "id": "E-006",
    "caseId": "CASE-00001",
    "type": "photo",
    "description": "Photo",
    "collectedAt": "2026-01-01T00:00:00Z",
    "collectedBy": "O-001",
    "title": "Photo 6",
    "status": "collected",
    "linkedPersons": [],
    "custodyHistory": [
      {
        "id": "CE-6-1",
        "action": "collected",
        "timestamp": "2026-01-01T00:00:00Z",
        "officerId": "O-001"
      }
    ]
  },
  {
    "id": "E-007",
    "caseId": "CASE-00001",
    "type": "photo",
    "description": "Photo",
    "collectedAt": "2026-01-01T00:00:00Z",
    "collectedBy": "O-001",
    "title": "Photo 7",
    "status": "collected",
    "linkedPersons": [],
    "custodyHistory": [
      {
        "id": "CE-7-1",
        "action": "collected",
        "timestamp": "2026-01-01T00:00:00Z",
        "officerId": "O-001"
      }
    ]
  },
  {
    "id": "E-008",
    "caseId": "CASE-00001",
    "type": "photo",
    "description": "Photo",
    "collectedAt": "2026-01-01T00:00:00Z",
    "collectedBy": "O-001",
    "title": "Photo 8",
    "status": "collected",
    "linkedPersons": [],
    "custodyHistory": [
      {
        "id": "CE-8-1",
        "action": "collected",
        "timestamp": "2026-01-01T00:00:00Z",
        "officerId": "O-001"
      }
    ]
  },
  {
    "id": "E-009",
    "caseId": "CASE-00001",
    "type": "photo",
    "description": "Photo",
    "collectedAt": "2026-01-01T00:00:00Z",
    "collectedBy": "O-001",
    "title": "Photo 9",
    "status": "collected",
    "linkedPersons": [],
    "custodyHistory": [
      {
        "id": "CE-9-1",
        "action": "collected",
        "timestamp": "2026-01-01T00:00:00Z",
        "officerId": "O-001"
      }
    ]
  },
  {
    "id": "E-010",
    "caseId": "CASE-00001",
    "type": "photo",
    "description": "Photo",
    "collectedAt": "2026-01-01T00:00:00Z",
    "collectedBy": "O-001",
    "title": "Photo 10",
    "status": "collected",
    "linkedPersons": [],
    "custodyHistory": [
      {
        "id": "CE-10-1",
        "action": "collected",
        "timestamp": "2026-01-01T00:00:00Z",
        "officerId": "O-001"
      }
    ]
  },
  {
    "id": "E-011",
    "caseId": "CASE-00001",
    "type": "photo",
    "description": "Photo",
    "collectedAt": "2026-01-01T00:00:00Z",
    "collectedBy": "O-001",
    "title": "Photo 11",
    "status": "collected",
    "linkedPersons": [],
    "custodyHistory": [
      {
        "id": "CE-11-1",
        "action": "collected",
        "timestamp": "2026-01-01T00:00:00Z",
        "officerId": "O-001"
      }
    ]
  },
  {
    "id": "E-012",
    "caseId": "CASE-00001",
    "type": "photo",
    "description": "Photo",
    "collectedAt": "2026-01-01T00:00:00Z",
    "collectedBy": "O-001",
    "title": "Photo 12",
    "status": "collected",
    "linkedPersons": [],
    "custodyHistory": [
      {
        "id": "CE-12-1",
        "action": "collected",
        "timestamp": "2026-01-01T00:00:00Z",
        "officerId": "O-001"
      }
    ]
  },
  {
    "id": "E-013",
    "caseId": "CASE-00001",
    "type": "photo",
    "description": "Photo",
    "collectedAt": "2026-01-01T00:00:00Z",
    "collectedBy": "O-001",
    "title": "Photo 13",
    "status": "collected",
    "linkedPersons": [],
    "custodyHistory": [
      {
        "id": "CE-13-1",
        "action": "collected",
        "timestamp": "2026-01-01T00:00:00Z",
        "officerId": "O-001"
      }
    ]
  },
  {
    "id": "E-014",
    "caseId": "CASE-00001",
    "type": "photo",
    "description": "Photo",
    "collectedAt": "2026-01-01T00:00:00Z",
    "collectedBy": "O-001",
    "title": "Photo 14",
    "status": "collected",
    "linkedPersons": [],
    "custodyHistory": [
      {
        "id": "CE-14-1",
        "action": "collected",
        "timestamp": "2026-01-01T00:00:00Z",
        "officerId": "O-001"
      }
    ]
  },
  {
    "id": "E-015",
    "caseId": "CASE-00001",
    "type": "photo",
    "description": "Photo",
    "collectedAt": "2026-01-01T00:00:00Z",
    "collectedBy": "O-001",
    "title": "Photo 15",
    "status": "collected",
    "linkedPersons": [],
    "custodyHistory": [
      {
        "id": "CE-15-1",
        "action": "collected",
        "timestamp": "2026-01-01T00:00:00Z",
        "officerId": "O-001"
      }
    ]
  },
  {
    "id": "E-016",
    "caseId": "CASE-00001",
    "type": "photo",
    "description": "Photo",
    "collectedAt": "2026-01-01T00:00:00Z",
    "collectedBy": "O-001",
    "title": "Photo 16",
    "status": "collected",
    "linkedPersons": [],
    "custodyHistory": [
      {
        "id": "CE-16-1",
        "action": "collected",
        "timestamp": "2026-01-01T00:00:00Z",
        "officerId": "O-001"
      }
    ]
  },
  {
    "id": "E-017",
    "caseId": "CASE-00001",
    "type": "photo",
    "description": "Photo",
    "collectedAt": "2026-01-01T00:00:00Z",
    "collectedBy": "O-001",
    "title": "Photo 17",
    "status": "collected",
    "linkedPersons": [],
    "custodyHistory": [
      {
        "id": "CE-17-1",
        "action": "collected",
        "timestamp": "2026-01-01T00:00:00Z",
        "officerId": "O-001"
      }
    ]
  },
  {
    "id": "E-018",
    "caseId": "CASE-00001",
    "type": "photo",
    "description": "Photo",
    "collectedAt": "2026-01-01T00:00:00Z",
    "collectedBy": "O-001",
    "title": "Photo 18",
    "status": "collected",
    "linkedPersons": [],
    "custodyHistory": [
      {
        "id": "CE-18-1",
        "action": "collected",
        "timestamp": "2026-01-01T00:00:00Z",
        "officerId": "O-001"
      }
    ]
  },
  {
    "id": "E-019",
    "caseId": "CASE-00001",
    "type": "photo",
    "description": "Photo",
    "collectedAt": "2026-01-01T00:00:00Z",
    "collectedBy": "O-001",
    "title": "Photo 19",
    "status": "collected",
    "linkedPersons": [],
    "custodyHistory": [
      {
        "id": "CE-19-1",
        "action": "collected",
        "timestamp": "2026-01-01T00:00:00Z",
        "officerId": "O-001"
      }
    ]
  },
  {
    "id": "E-020",
    "caseId": "CASE-00001",
    "type": "photo",
    "description": "Photo",
    "collectedAt": "2026-01-01T00:00:00Z",
    "collectedBy": "O-001",
    "title": "Photo 20",
    "status": "collected",
    "linkedPersons": [],
    "custodyHistory": [
      {
        "id": "CE-20-1",
        "action": "collected",
        "timestamp": "2026-01-01T00:00:00Z",
        "officerId": "O-001"
      }
    ]
  },
  {
    "id": "E-021",
    "caseId": "CASE-00001",
    "type": "photo",
    "description": "Photo",
    "collectedAt": "2026-01-01T00:00:00Z",
    "collectedBy": "O-001",
    "title": "Photo 21",
    "status": "collected",
    "linkedPersons": [],
    "custodyHistory": [
      {
        "id": "CE-21-1",
        "action": "collected",
        "timestamp": "2026-01-01T00:00:00Z",
        "officerId": "O-001"
      }
    ]
  },
  {
    "id": "E-022",
    "caseId": "CASE-00001",
    "type": "photo",
    "description": "Photo",
    "collectedAt": "2026-01-01T00:00:00Z",
    "collectedBy": "O-001",
    "title": "Photo 22",
    "status": "collected",
    "linkedPersons": [],
    "custodyHistory": [
      {
        "id": "CE-22-1",
        "action": "collected",
        "timestamp": "2026-01-01T00:00:00Z",
        "officerId": "O-001"
      }
    ]
  },
  {
    "id": "E-023",
    "caseId": "CASE-00001",
    "type": "photo",
    "description": "Photo",
    "collectedAt": "2026-01-01T00:00:00Z",
    "collectedBy": "O-001",
    "title": "Photo 23",
    "status": "collected",
    "linkedPersons": [],
    "custodyHistory": [
      {
        "id": "CE-23-1",
        "action": "collected",
        "timestamp": "2026-01-01T00:00:00Z",
        "officerId": "O-001"
      }
    ]
  },
  {
    "id": "E-025",
    "caseId": "CASE-00001",
    "type": "photo",
    "description": "Photo",
    "collectedAt": "2026-01-01T00:00:00Z",
    "collectedBy": "O-001",
    "title": "Photo 25",
    "status": "collected",
    "linkedPersons": [],
    "custodyHistory": [
      {
        "id": "CE-25-1",
        "action": "collected",
        "timestamp": "2026-01-01T00:00:00Z",
        "officerId": "O-001"
      }
    ]
  },
  {
    "id": "E-026",
    "caseId": "CASE-00001",
    "type": "photo",
    "description": "Photo",
    "collectedAt": "2026-01-01T00:00:00Z",
    "collectedBy": "O-001",
    "title": "Photo 26",
    "status": "collected",
    "linkedPersons": [],
    "custodyHistory": [
      {
        "id": "CE-26-1",
        "action": "collected",
        "timestamp": "2026-01-01T00:00:00Z",
        "officerId": "O-001"
      }
    ]
  },
  {
    "id": "E-027",
    "caseId": "CASE-00001",
    "type": "photo",
    "description": "Photo",
    "collectedAt": "2026-01-01T00:00:00Z",
    "collectedBy": "O-001",
    "title": "Photo 27",
    "status": "collected",
    "linkedPersons": [],
    "custodyHistory": [
      {
        "id": "CE-27-1",
        "action": "collected",
        "timestamp": "2026-01-01T00:00:00Z",
        "officerId": "O-001"
      }
    ]
  },
  {
    "id": "E-028",
    "caseId": "CASE-00001",
    "type": "photo",
    "description": "Photo",
    "collectedAt": "2026-01-01T00:00:00Z",
    "collectedBy": "O-001",
    "title": "Photo 28",
    "status": "collected",
    "linkedPersons": [],
    "custodyHistory": [
      {
        "id": "CE-28-1",
        "action": "collected",
        "timestamp": "2026-01-01T00:00:00Z",
        "officerId": "O-001"
      }
    ]
  }
];
