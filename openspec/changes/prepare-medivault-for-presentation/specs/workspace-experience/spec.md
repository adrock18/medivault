# Spec Delta

## ADDED Requirements

### Requirement: Accurate current-product presentation

Authentication screens, browser metadata, sample-data prompts, and current documentation SHALL describe supported medication, medical-record, and reviewed prescription-scanning workflows. They SHALL not advertise the retired measurement interface or unimplemented notification, diagnosis, or treatment features.

#### Scenario: Inspect public product messaging

- **WHEN** a signed-out user opens login or registration and inspects the page description
- **THEN** the product messaging reflects medication and medical-record management
- **AND** it does not promise measurement logging or charts

#### Scenario: Review fictional sample setup

- **WHEN** a signed-in user opens the sample-data confirmation
- **THEN** it accurately describes the entries the action creates and their fictional nature
- **AND** it does not promise newly seeded health readings
- **AND** existing measurements remain preserved and exportable without reintroducing a tracker interface
