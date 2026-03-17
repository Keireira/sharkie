# Sharkie

[![GitHub License](https://img.shields.io/github/license/Keireira/sharkie?&style=flat-square)](https://github.com/Keireira/sharkie/blob/master/LICENSE)
[![Registry](https://img.shields.io/github/deployments/Keireira/sharkie/registry?label=registry&style=flat-square)](https://github.com/Keireira/sharkie/deployments/registry)
[![Production](https://img.shields.io/github/deployments/Keireira/sharkie/production?label=production&style=flat-square)](https://github.com/Keireira/sharkie/deployments/production)
![GitHub repo size](https://img.shields.io/github/repo-size/Keireira/sharkie)
![GitHub last commit](https://img.shields.io/github/last-commit/keireira/sharkie)

Real-time currency exchange rates dashboard + API.

> [!NOTE]  
> Be aware that [documentation](./docs) and [frontend](./frontend) parts, though somewhat verified by me on security side, was written by an AI agents. So do not expect these parts to be any good, and do not expect the frontend to behave in a way you want (this is just an additional gimmick for internal usage, while the real purpose of this API is to serve rates for my [subscription tracker for iOS](https://github.com/Keireira/uha))

## Documentation

For instructions make `make dev-docs` locally and open `http://localhost:3333` after

## Crontab

```
0 3 * * * /path/to/backup.sh && find $HOME/sharkie_backups -name "*.dump" -mtime +30 -delete
```

## License

[AGPL-3.0](LICENSE)
