import type { InvestigationEdge } from '../types';

export const relationships: InvestigationEdge[] = [
  {
    "source": "P-001",
    "target": "L-001",
    "relationship": "visited"
  },
  {
    "source": "P-001",
    "target": "L-002",
    "relationship": "visited"
  },
  {
    "source": "P-002",
    "target": "L-001",
    "relationship": "visited"
  },
  {
    "source": "P-002",
    "target": "L-002",
    "relationship": "visited"
  },
  {
    "source": "P-001",
    "target": "V-001",
    "relationship": "owns"
  },
  {
    "source": "P-002",
    "target": "V-001",
    "relationship": "connected-to"
  },
  {
    "source": "P-001",
    "target": "I-023",
    "relationship": "involved-in"
  },
  {
    "source": "P-002",
    "target": "I-023",
    "relationship": "involved-in"
  },
  {
    "source": "V-001",
    "target": "CASE-00022",
    "relationship": "connected-to"
  },
  {
    "source": "V-001",
    "target": "CASE-00031",
    "relationship": "connected-to"
  },
  {
    "source": "P-004",
    "target": "V-001",
    "relationship": "connected-to"
  },
  {
    "source": "P-001",
    "target": "V-007",
    "relationship": "connected-to"
  },
  {
    "source": "P-003",
    "target": "V-007",
    "relationship": "owns"
  },
  {
    "source": "P-003",
    "target": "I-004",
    "relationship": "involved-in"
  },
  {
    "source": "P-006",
    "target": "I-004",
    "relationship": "involved-in"
  },
  {
    "source": "P-017",
    "target": "I-011",
    "relationship": "involved-in"
  },
  {
    "source": "P-023",
    "target": "I-006",
    "relationship": "involved-in"
  },
  {
    "source": "P-022",
    "target": "I-005",
    "relationship": "involved-in"
  },
  {
    "source": "P-017",
    "target": "I-002",
    "relationship": "involved-in"
  },
  {
    "source": "P-017",
    "target": "I-012",
    "relationship": "involved-in"
  },
  {
    "source": "P-015",
    "target": "I-002",
    "relationship": "involved-in"
  },
  {
    "source": "P-012",
    "target": "I-006",
    "relationship": "involved-in"
  },
  {
    "source": "P-024",
    "target": "I-012",
    "relationship": "involved-in"
  },
  {
    "source": "P-020",
    "target": "I-006",
    "relationship": "involved-in"
  },
  {
    "source": "P-015",
    "target": "I-001",
    "relationship": "involved-in"
  },
  {
    "source": "P-020",
    "target": "I-008",
    "relationship": "involved-in"
  },
  {
    "source": "P-019",
    "target": "I-001",
    "relationship": "involved-in"
  },
  {
    "source": "P-018",
    "target": "I-006",
    "relationship": "involved-in"
  },
  {
    "source": "P-010",
    "target": "I-004",
    "relationship": "involved-in"
  },
  {
    "source": "P-016",
    "target": "I-010",
    "relationship": "involved-in"
  },
  {
    "source": "P-020",
    "target": "I-001",
    "relationship": "involved-in"
  },
  {
    "source": "P-023",
    "target": "I-002",
    "relationship": "involved-in"
  },
  {
    "source": "P-012",
    "target": "I-004",
    "relationship": "involved-in"
  },
  {
    "source": "P-020",
    "target": "I-002",
    "relationship": "involved-in"
  },
  {
    "source": "P-022",
    "target": "I-007",
    "relationship": "involved-in"
  },
  {
    "source": "P-024",
    "target": "I-008",
    "relationship": "involved-in"
  },
  {
    "source": "P-011",
    "target": "I-009",
    "relationship": "involved-in"
  },
  {
    "source": "P-017",
    "target": "I-006",
    "relationship": "involved-in"
  },
  {
    "source": "P-025",
    "target": "I-001",
    "relationship": "involved-in"
  },
  {
    "source": "P-012",
    "target": "I-003",
    "relationship": "involved-in"
  },
  {
    "source": "P-013",
    "target": "I-010",
    "relationship": "involved-in"
  },
  {
    "source": "P-024",
    "target": "I-010",
    "relationship": "involved-in"
  },
  {
    "source": "P-025",
    "target": "I-007",
    "relationship": "involved-in"
  },
  {
    "source": "P-021",
    "target": "I-007",
    "relationship": "involved-in"
  },
  {
    "source": "P-024",
    "target": "I-005",
    "relationship": "involved-in"
  },
  {
    "source": "P-022",
    "target": "I-011",
    "relationship": "involved-in"
  },
  {
    "source": "P-025",
    "target": "I-012",
    "relationship": "involved-in"
  },
  {
    "source": "P-022",
    "target": "I-010",
    "relationship": "involved-in"
  },
  {
    "source": "P-024",
    "target": "I-001",
    "relationship": "involved-in"
  },
  {
    "source": "P-015",
    "target": "I-009",
    "relationship": "involved-in"
  },
  {
    "source": "P-013",
    "target": "I-012",
    "relationship": "involved-in"
  },
  {
    "source": "P-022",
    "target": "I-010",
    "relationship": "involved-in"
  },
  {
    "source": "P-015",
    "target": "I-007",
    "relationship": "involved-in"
  },
  {
    "source": "P-012",
    "target": "I-008",
    "relationship": "involved-in"
  },
  {
    "source": "P-026",
    "target": "I-007",
    "relationship": "involved-in"
  },
  {
    "source": "P-023",
    "target": "I-008",
    "relationship": "involved-in"
  },
  {
    "source": "P-024",
    "target": "I-005",
    "relationship": "involved-in"
  },
  {
    "source": "P-017",
    "target": "I-008",
    "relationship": "involved-in"
  },
  {
    "source": "P-020",
    "target": "I-012",
    "relationship": "involved-in"
  },
  {
    "source": "P-010",
    "target": "I-003",
    "relationship": "involved-in"
  },
  {
    "source": "P-014",
    "target": "I-001",
    "relationship": "involved-in"
  },
  {
    "source": "P-016",
    "target": "I-003",
    "relationship": "involved-in"
  },
  {
    "source": "P-020",
    "target": "I-002",
    "relationship": "involved-in"
  },
  {
    "source": "P-013",
    "target": "I-003",
    "relationship": "involved-in"
  },
  {
    "source": "P-012",
    "target": "I-007",
    "relationship": "involved-in"
  },
  {
    "source": "P-010",
    "target": "I-007",
    "relationship": "involved-in"
  },
  {
    "source": "P-025",
    "target": "I-011",
    "relationship": "involved-in"
  },
  {
    "source": "P-018",
    "target": "I-011",
    "relationship": "involved-in"
  },
  {
    "source": "P-020",
    "target": "I-011",
    "relationship": "involved-in"
  },
  {
    "source": "P-017",
    "target": "I-011",
    "relationship": "involved-in"
  },
  {
    "source": "P-011",
    "target": "I-008",
    "relationship": "involved-in"
  },
  {
    "source": "P-023",
    "target": "I-003",
    "relationship": "involved-in"
  },
  {
    "source": "P-017",
    "target": "I-007",
    "relationship": "involved-in"
  },
  {
    "source": "P-020",
    "target": "I-005",
    "relationship": "involved-in"
  },
  {
    "source": "P-017",
    "target": "I-001",
    "relationship": "involved-in"
  },
  {
    "source": "P-015",
    "target": "I-007",
    "relationship": "involved-in"
  },
  {
    "source": "P-011",
    "target": "I-005",
    "relationship": "involved-in"
  },
  {
    "source": "P-011",
    "target": "I-005",
    "relationship": "involved-in"
  },
  {
    "source": "P-017",
    "target": "I-009",
    "relationship": "involved-in"
  },
  {
    "source": "P-026",
    "target": "I-001",
    "relationship": "involved-in"
  },
  {
    "source": "P-025",
    "target": "I-011",
    "relationship": "involved-in"
  },
  {
    "source": "P-015",
    "target": "I-005",
    "relationship": "involved-in"
  },
  {
    "source": "P-026",
    "target": "I-007",
    "relationship": "involved-in"
  },
  {
    "source": "P-011",
    "target": "I-006",
    "relationship": "involved-in"
  },
  {
    "source": "P-010",
    "target": "I-012",
    "relationship": "involved-in"
  },
  {
    "source": "P-002",
    "target": "I-024",
    "relationship": "involved-in"
  },
  {
    "source": "P-027",
    "target": "I-024",
    "relationship": "involved-in"
  },
  {
    "source": "P-028",
    "target": "I-024",
    "relationship": "witnessed"
  },
  {
    "source": "P-027",
    "target": "L-003",
    "relationship": "visited"
  },
  {
    "source": "P-028",
    "target": "L-003",
    "relationship": "visited"
  },
  {
    "source": "V-001",
    "target": "CASE-00201",
    "relationship": "connected-to"
  },
  {
    "source": "P-029",
    "target": "I-025",
    "relationship": "involved-in"
  },
  {
    "source": "P-030",
    "target": "I-025",
    "relationship": "witnessed"
  },
  {
    "source": "P-029",
    "target": "L-001",
    "relationship": "visited"
  },
  {
    "source": "P-029",
    "target": "V-011",
    "relationship": "owns"
  },
  {
    "source": "P-031",
    "target": "I-026",
    "relationship": "involved-in"
  },
  {
    "source": "P-032",
    "target": "I-026",
    "relationship": "involved-in"
  },
  {
    "source": "P-033",
    "target": "I-026",
    "relationship": "involved-in"
  },
  {
    "source": "P-034",
    "target": "I-026",
    "relationship": "involved-in"
  },
  {
    "source": "P-031",
    "target": "L-007",
    "relationship": "visited"
  },
  {
    "source": "P-032",
    "target": "L-007",
    "relationship": "visited"
  },
  {
    "source": "P-033",
    "target": "L-007",
    "relationship": "visited"
  },
  {
    "source": "P-035",
    "target": "I-027",
    "relationship": "involved-in"
  },
  {
    "source": "P-036",
    "target": "I-027",
    "relationship": "involved-in"
  },
  {
    "source": "P-035",
    "target": "L-005",
    "relationship": "visited"
  }
];
