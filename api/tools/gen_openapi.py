import json, os
R=lambda n:{"$ref":"#/components/schemas/"+n}
S={"type":"string"}
DT={"type":"string","format":"date-time"}
def obj(props,req=()):
    d={"type":"object","properties":props}
    if req:d["required"]=list(req)
    return d
def arr(x):return {"type":"array","items":x}
def pathp(n,d):return {"name":n,"in":"path","required":True,"schema":S,"description":d}
OFF={"$ref":"#/components/parameters/ActingOfficer"}
def body(sch):return {"required":True,"content":{"application/json":{"schema":sch}}}
def resp(kind):
    ok={"description":"Success","content":{"application/json":{"schema":R(kind)}}}
    e=lambda d:{"description":d,"content":{"application/json":{"schema":R("Error")}}}
    return {"200":ok,"400":e("Validation failed (message in `error`)"),"404":e("Record not found")}
def op(tag,summary,desc,params=(),b=None,kind="MutationResult",extra=None):
    o={"tags":[tag],"summary":summary,"description":desc,"parameters":list(params)+[OFF],"responses":resp(kind)}
    if b:o["requestBody"]=body(b)
    if extra:o["responses"].update(extra)
    return o
CASE=pathp("caseId","e.g. CASE-00123")
PER=pathp("personId","e.g. P-001")
paths={}
paths["/health"]={"get":{"tags":["System"],"summary":"Health check","responses":{"200":{"description":"API is up"}}}}
paths["/investigation"]={"get":{"tags":["System"],"summary":"Full dataset snapshot","description":"Everything the frontend needs, in one call: officers, locations, cases, persons (with relatedCases), incidents, evidence (with custodyHistory + linkedPersons), vehicles, documents, notes, witnessStatements, sightings, phoneRecords, activityLog (newest first), relationships. **Every sidebar tab reads from this one snapshot** (loaded once at startup into the zustand store); filtering/search/graph/timeline logic runs client-side.","responses":{"200":{"description":"InvestigationData","content":{"application/json":{"schema":R("InvestigationData")}}}}}}
paths["/cases"]={"post":op("Cases","Create a case","ID comes from the CASE counter; status starts as `open`; logs `case-created`.",b=obj({"title":S,"description":S,"type":R("CaseType"),"priority":R("Priority"),"leadInvestigator":{"type":"string","example":"O-001"}},["title","description","type","priority","leadInvestigator"]),kind="ServerResult")}
paths["/cases/{caseId}/priority"]={"patch":op("Cases","Change priority","Logs `priority-changed`.",[CASE],obj({"priority":R("Priority")},["priority"]),"ServerResult")}
paths["/cases/{caseId}/status"]={"patch":op("Cases","Change status","Logs `status-changed`.",[CASE],obj({"status":R("CaseStatus")},["status"]),"ServerResult")}
paths["/cases/{caseId}/lead-investigator"]={"patch":op("Cases","Change lead investigator","Logs `lead-changed`.",[CASE],obj({"officerId":S},["officerId"]),"ServerResult")}
paths["/cases/{caseId}/notes"]={"post":op("Cases","Add a note","Author = acting officer. Logs `note-added`.",[CASE],obj({"text":S},["text"]),"ServerResult")}
paths["/cases/{caseId}/documents"]={"post":op("Cases","Add a document","ID prefix D-. Logs `document-added`.",[CASE],obj({"title":S,"kind":R("DocKind")},["title","kind"]),"ServerResult")}
paths["/cases/{caseId}/persons"]={"post":op("People","Create a person and add to case","Creates the person (P- id) and links them to the case. Logs `person-added`.",[CASE],obj({"fullName":S,"type":R("PersonType"),"phone":S,"address":S},["fullName","type"]))}
paths["/cases/{caseId}/persons/link"]={"post":op("People","Add an existing person to a case","Idempotent. Logs `person-added`.",[CASE],obj({"personId":S},["personId"]))}
paths["/cases/{caseId}/persons/{personId}"]={"delete":op("People","Remove a person from a case","Unlinks from this case only. Also deletes edges to this case's incidents/evidence and the person's evidence links for this case. Person record and other cases are untouched.",[CASE,PER])}
paths["/persons/{personId}"]={"patch":op("People","Edit a person","Full replace of the editable fields (omitted phone/address/aliases are cleared). Logs an activity entry in every case the person belongs to.",[PER],obj({"fullName":S,"type":R("PersonType"),"phone":S,"address":S,"knownAliases":arr(S)},["fullName","type"]))}
paths["/cases/{caseId}/incidents"]={"post":op("Incidents","Add an incident","Occurred time cannot be in the future. Logs `incident-added`.",[CASE],obj({"title":S,"description":S,"type":R("CaseType"),"locationId":S,"occurredAt":DT,"status":R("IncidentStatus")},["title","description","type","locationId","occurredAt","status"]))}
paths["/locations"]={"post":op("Locations","Create a location","De-duplicated by lower(name)+lower(city): if it exists, the existing id is returned and nothing is created.",b=obj({"name":S,"city":S,"region":S},["name","city","region"]))}
paths["/cases/{caseId}/visited-locations"]={"post":op("Locations","Record that a person visited a location","Adds a `visited` edge (idempotent).",[CASE],obj({"locationId":S,"personId":S},["locationId","personId"]))}
paths["/cases/{caseId}/locations/{locationId}"]={"delete":op("Locations","Remove a location from a case","Deletes this case's `visited` edges and sightings at the location, clears evidence.locationId, and moves the case's incidents to another location (400 if none exists).",[CASE,pathp("locationId","e.g. L-001")])}
paths["/cases/{caseId}/vehicles"]={"post":op("Vehicles","Create a vehicle","Duplicate plate returns 409. `connections` link the vehicle to people/incidents; an `owns` connection runs the owner-conflict rule.",[CASE],obj({"registration":S,"make":S,"model":S,"color":S,"connections":arr(obj({"targetId":S,"relationship":{"type":"string","enum":["owns","connected-to","involved-in"]}}))},["registration","make","model","color"]),extra={"409":{"description":"Plate already exists","content":{"application/json":{"schema":R("Error")}}}})}
paths["/cases/{caseId}/vehicles/{vehicleId}"]={"delete":op("Vehicles","Remove a vehicle from a case","Deletes edges to this case's people/incidents, detaches the owner if in this case, deletes this case's sightings of the vehicle.",[CASE,pathp("vehicleId","e.g. V-001")])}
paths["/cases/{caseId}/connections"]={"post":op("Graph","Add a relationship edge","`source` must be a person (P-). Target kind depends on relationship: visited->L-, involved-in/witnessed->I-, owns/connected-to->V-. `owns` demotes the previous owner to `connected-to` and logs `vehicle-linked`.",[CASE],obj({"source":S,"target":S,"relationship":R("Relationship")},["source","target","relationship"]))}
paths["/cases/{caseId}/witness-statements"]={"post":op("Timeline records","Add a witness statement","Times cannot be in the future. Logs `timeline-record-added`.",[CASE],obj({"witnessId":S,"subjectPersonId":S,"locationId":S,"claimedTime":DT,"recordedAt":DT,"text":S},["witnessId","subjectPersonId","locationId","claimedTime","recordedAt","text"]))}
paths["/cases/{caseId}/sightings"]={"post":op("Timeline records","Add a sighting","Needs a vehicleId or personId (or both).",[CASE],obj({"source":R("SightingSource"),"action":R("SightingAction"),"locationId":S,"timestamp":DT,"vehicleId":S,"personId":S,"description":S},["source","action","locationId","timestamp","description"]))}
paths["/cases/{caseId}/phone-records"]={"post":op("Timeline records","Add a phone record","`cell-tower` needs locationId; `call`/`sms` need otherNumber.",[CASE],obj({"personId":S,"phoneNumber":S,"kind":R("PhoneKind"),"timestamp":DT,"locationId":S,"otherNumber":S},["personId","phoneNumber","kind","timestamp"]))}
paths["/cases/{caseId}/evidence"]={"post":op("Evidence","Upload evidence","ID prefix E-; status `collected`; first custody entry created for the acting officer. Logs `evidence-uploaded`.",[CASE],obj({"title":S,"type":R("EvidenceType"),"description":S,"locationId":S,"linkedPersons":arr(S)},["title","type","description"]))}
paths["/evidence/{evidenceId}/custody"]={"post":op("Evidence","Apply a custody action","State machine: collected/with-officer -> transfer or submit; in-evidence-room -> transfer/analysis-started/released/destroyed; under-analysis -> analysis-completed; analysed -> transfer/submit/released/destroyed; released/destroyed are final. Only the current custodian may transfer/submit/start analysis (unless in the evidence room). Rule violations return 400 with the reason.",[pathp("evidenceId","e.g. E-036")],obj({"action":R("CustodyAction"),"toOfficerId":{"type":"string","description":"Required for `transferred`"},"note":S},["action"]))}
E=lambda *v:{"type":"string","enum":list(v)}
schemas={
"Error":obj({"error":S}),
"CaseType":E("theft","fraud","assault","cybercrime","other"),
"Priority":E("low","medium","high","critical"),
"CaseStatus":E("open","investigating","pending","closed"),
"PersonType":E("suspect","witness","victim","person-of-interest"),
"IncidentStatus":E("unresolved","resolved"),
"DocKind":E("report","warrant","statement","court-order","other"),
"EvidenceType":E("document","photo","video","device","vehicle","digital"),
"CustodyAction":E("collected","transferred","submitted-to-evidence-room","analysis-started","analysis-completed","released","destroyed"),
"Relationship":E("owns","visited","witnessed","involved-in","connected-to"),
"SightingSource":E("cctv","patrol","anpr","informant"),
"SightingAction":E("entered","left","seen"),
"PhoneKind":E("call","sms","cell-tower"),
"Case":obj({"id":S,"title":S,"description":S,"type":R("CaseType"),"priority":R("Priority"),"status":R("CaseStatus"),"leadInvestigator":S,"createdAt":DT,"updatedAt":DT}),
"ActivityLogEntry":obj({"id":S,"caseId":S,"officerId":S,"timestamp":DT,"action":S,"description":S}),
"InvestigationData":obj({k:{"type":"array","items":{"type":"object"}} for k in ["officers","locations","cases","persons","incidents","evidence","vehicles","documents","notes","witnessStatements","sightings","phoneRecords","activityLog","relationships"]}),
"MutationResult":obj({"id":{"type":"string","nullable":True,"description":"The created/affected record"},"data":R("InvestigationData")}),
"ServerResult":obj({"case":R("Case"),"activity":R("ActivityLogEntry"),"note":{"type":"object"},"document":{"type":"object"}}),
}
spec={"openapi":"3.0.3","info":{"title":"Investigation-Man-Sys API","version":"0.1.0","description":"Rust (Axum + SQLx) backend on Postgres. Reads: one snapshot endpoint. Writes: per-action endpoints, each in one transaction, logging activity and returning `{id, data}` (fresh snapshot) or `{case, activity, ...}` for case-level edits. Send `X-Officer-Id` to say who is acting."},
"servers":[{"url":"/api"}],
"tags":[{"name":n} for n in ["System","Cases","People","Incidents","Evidence","Vehicles","Locations","Timeline records","Graph"]],
"paths":paths,
"components":{"parameters":{"ActingOfficer":{"name":"X-Officer-Id","in":"header","required":False,"description":"Acting officer (no auth yet)","schema":{"type":"string","default":"O-001"}}},"schemas":schemas}}
out="{\n"+",\n".join('"%s":%s'%(k,json.dumps(v,separators=(',',':'),ensure_ascii=True)) for k,v in spec.items() if k!="paths")
out+=',\n"paths":{\n'+",\n".join('%s:%s'%(json.dumps(k),json.dumps(v,separators=(',',':'))) for k,v in paths.items())+"\n}\n}\n"
json.loads(out)
open(os.path.join(os.path.dirname(os.path.abspath(__file__)),"..","openapi.json"),"w",encoding="ascii").write(out)
print(len(out), "bytes OK;", len(paths), "paths")
