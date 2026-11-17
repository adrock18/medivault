# Spec Delta

## Purpose

Lets an account owner organize dated visits into optional care tracks and correct those records over time. Organization is user-defined context, not a clinical relationship or recommendation.

## ADDED Requirements

### Requirement: Owner can edit care tracks and visits

The workspace SHALL let an authenticated account owner edit a care track or visit for a family profile they manage. Saved edits SHALL remain scoped to that profile and persist after reload; the workspace SHALL not infer clinical relationships.

#### Scenario: Edit a care track

- **WHEN** an owner changes a care track's title or type and saves valid values
- **THEN** the updated track appears in the selected profile's timeline
- **AND** the change remains after reload

#### Scenario: Edit a visit and its optional track

- **WHEN** an owner changes a visit's details or optional care-track association and saves valid values
- **THEN** the visit and its documents remain associated with the same family profile
- **AND** the updated visit and chosen track association remain after reload
- **AND** no relationship is inferred for visits the owner leaves standalone
