"""Run the weekly promotion pull for the store whose list updates today.

FairPrice Weekly Promotions change on Thursday (04:01 Singapore time).
Sheng Siong's in-store leaflet is a two-week special posted on a Friday;
the online promotion list is refreshed on that same Friday run.

  python scrapers/run_promos.py fairprice
  python scrapers/run_promos.py shengsiong
  python scrapers/run_promos.py due
"""
import sys
from datetime import datetime
from zoneinfo import ZoneInfo

from fairprice_promos import pull as pull_fairprice
from shengsiong_promos import pull as pull_shengsiong

SGT = ZoneInfo("Asia/Singapore")


def main():
    which = sys.argv[1] if len(sys.argv) > 1 else "due"
    if which == "due":
        weekday = datetime.now(SGT).strftime("%A")
        which = {"Thursday": "fairprice", "Friday": "shengsiong"}.get(weekday)
        if not which:
            print(f"{weekday} is not a promotion day. FairPrice runs Thursday, Sheng Siong runs Friday.")
            return
    if which == "fairprice":
        pull_fairprice()
        return
    if which == "shengsiong":
        pull_shengsiong()
        return
    raise SystemExit("Use fairprice, shengsiong, or due.")


if __name__ == "__main__":
    main()
