# Contributing to GeoMoose

## Welcome

The GeoMoose Project Steering Committee and maintainers strive to promote a welcoming environment for all contributors.  We welcome both technical and non-technical contributions (e.g., documentation, translations, testing, community support, design).

## How to connect with the GeoMoose community

General discussion (project direction, future ideas, non-code help):
- [GitHub Discussions](https://github.com/orgs/geomoose/discussions)
- [Email list](https://lists.osgeo.org/pipermail/geomoose-users/)
- [Matrix channel](https://matrix.to/#/#geomoose:osgeo.org)

Technical issues with the GeoMoose 3 code:
- [GitHub Issues](https://github.com/geomoose/gm3/issues) — bug reports
- [GitHub Pull Requests (PR)](https://github.com/geomoose/gm3/pulls) — proposed code changes
- [Security Issues](https://github.com/geomoose/gm3/security) — report security issues

We especially appreciate bug reports that include a proposed fix.

## Before a Pull Request can be merged

1. Code must follow the [coding style guide](docs/style_guide.md).
2. All tests (including the linter) must pass.  (You can run `npm test` locally, or wait for the GitHub CI Action.)
3. The contributor must confirm that the code may be released under the GeoMoose [License](LICENSE.md) (see [RFC-4](https://geomoose.org/rfc/rfc-4.html) for full details).
4. Keep changes minimal. Large refactors are usually rejected.  If a bigger change is genuinely needed, split it into a series of small, self-contained commits.
5. Contributions must serve a project goal.  Changes for change sake will be rejected.

Please respect the time and effort it takes for us to review contributions.

## Using AI/LLMs

Human-written contributions are preferred, but AI/LLM tooling is allowed if you follow these guidelines:

1. Contributions must be initiated by a human.  Fully automated agent contributions (e.g., a bot opening a PR without human involvement) are not acceptable.
2. Contributions must be reviewed and understood by a human.  For example, blindly copying and pasting responses from an LLM into a PR is not acceptable.  The human making the contribution is responsible for their contribution(s).
3. Avoid the typical high verbosity of LLM code and text.  More code is more code to maintain.

These guidelines are here to protect the interests of the GeoMoose project's active members without blocking the adoption of new tooling.  They will be subject to change over time as the technological, legal, and ethical landscape evolves.
