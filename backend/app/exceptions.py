class UpstreamUnavailableError(Exception):
    pass


class UpstreamDataError(Exception):
    pass


class TrialNotFoundError(Exception):
    pass


class UpstreamRateLimitedError(Exception):
    pass
