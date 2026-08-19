from app.clients.clinicaltrials import map_trial


def test_map_trial_extracts_all_fields():
    raw = {
        "protocolSection": {
            "identificationModule": {
                "nctId": "NCT07305935",
                "briefTitle": "Comparison of Early Caffeine Administration Vs Supportive Therapy in Preventing Acute Kidney Injury",
            },
            "statusModule": {"overallStatus": "COMPLETED"},
            "conditionsModule": {"conditions": ["Preterm Birth"]},
            "designModule": {"phases": ["NA"]},
            "armsInterventionsModule": {
                "interventions": [
                    {"name": "Caffeine"},
                    {"name": "Supportive care"},
                ]
            },
        }
    }

    trial = map_trial(raw)

    assert trial.nct_id == "NCT07305935"
    assert (
        trial.brief_title
        == "Comparison of Early Caffeine Administration Vs Supportive Therapy in Preventing Acute Kidney Injury"
    )
    assert trial.overall_status == "COMPLETED"
    assert trial.conditions == ["Preterm Birth"]
    assert trial.phases == ["NA"]
    assert trial.interventions == ["Caffeine", "Supportive care"]


def test_map_trial_defaults_missing_module():
    raw = {
        "protocolSection": {
            "identificationModule": {
                "nctId": "NCT07305935",
                "briefTitle": "Comparison of Early Caffeine Administration Vs Supportive Therapy in Preventing Acute Kidney Injury",
            },
            "statusModule": {"overallStatus": "COMPLETED"},
            "conditionsModule": {"conditions": ["Preterm Birth"]},
            "designModule": {"phases": ["NA"]},
            # Missing armsInterventionsModule
        }
    }

    trial = map_trial(raw)
    assert trial.interventions == []
