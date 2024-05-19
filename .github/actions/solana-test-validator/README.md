# TimescaleDB GitHub Action

This [GitHub Action](https://github.com/features/actions) sets up a TimescaleDB database into a docker container.

# Usage

See [action.yml](action.yml)

Basic:
```yaml
steps:
- uses: tchambard/timescaledb-action@v1
  with:
    timescaledb_version: 'latest'  # See https://hub.docker.com/r/timescale/timescaledb/ for available versions
    postgresql_version: 'pg12'  # See https://hub.docker.com/r/timescale/timescaledb/ for available versions
```

# License

The scripts and documentation in this project are released under the [MIT License](LICENSE)
