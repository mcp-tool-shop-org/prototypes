"""Allow running as `python -m stresskit_cli`."""
from stresskit_cli import main
import sys

if __name__ == "__main__":
    sys.exit(main())
