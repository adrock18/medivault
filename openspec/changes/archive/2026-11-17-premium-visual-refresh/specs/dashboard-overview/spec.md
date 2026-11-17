# Spec Delta

## MODIFIED Requirements

### Requirement: Honest medication progress

The daily overview SHALL distinguish taken, skipped, and unlogged scheduled doses. A dose whose time has passed without an outcome SHALL be labeled "Not logged". Past-time indicators SHALL not automatically count doses as missed, taken, or skipped and SHALL not recommend taking late or additional doses.

#### Scenario: A scheduled time passes without a log

- **WHEN** a dose's local scheduled time passes and no outcome has been recorded
- **THEN** the dose remains unlogged and is labeled "Not logged"
- **AND** taken and skipped totals remain unchanged
- **AND** the word missed is not used for that dose
