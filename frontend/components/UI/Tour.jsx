"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Steps } from "intro.js-react";
import { useUserStore } from "@/store/useUserStore";
import { completeTourAction } from "@/actions/userActions";
import { showConfirmationDialog } from "@/utils/alert";
import "intro.js/introjs.css";

export default function Tour({ steps, tourKey }) {
  // TODO : removing this thing for now but would surely need to implement this so that the user can onboard easily
  return null;
  const { user, markTourCompleted } = useUserStore();
  const [enabled, setEnabled] = useState(false);
  const tourCheckInitiated = useRef(false);

  const onExit = async () => {
    setEnabled(false);
    await completeTourAction(tourKey);
    markTourCompleted(tourKey);
  };

  const hasSeenTour = useMemo(() => {
    if (!user) return false;
    const completedTours = user.completedTours || [];
    return completedTours.includes(tourKey);
  }, [user?.completedTours, tourKey]);

  useEffect(() => {
    tourCheckInitiated.current = false;
  }, [tourKey]);

  useEffect(() => {
    console.log("[Tour Debug] Effect triggered", {
      tourKey,
      hasUser: !!user,
      hasSeenTour,
      checkInitiated: tourCheckInitiated.current,
    });

    if (!user) {
      console.log("[Tour Debug] No user, returning early");
      return;
    }

    if (hasSeenTour) {
      console.log("[Tour Debug] Tour already seen, skipping");
      setEnabled(false);
      return;
    }

    if (tourCheckInitiated.current) {
      console.log("[Tour Debug] Tour check already initiated, skipping");
      return;
    }

    tourCheckInitiated.current = true;
    let isMounted = true;

    console.log("[Tour Debug] Initiating tour check for:", tourKey);

    const checkTour = async () => {
      if (!isMounted) {
        console.log("[Tour Debug] Component unmounted before dialog, skipping");
        return;
      }

      try {
        console.log("[Tour Debug] Showing confirmation dialog");
        const result = await showConfirmationDialog(
          "QUICK TOUR?",
          `WE DETECTED YOU ARE NEW TO THE ${tourKey.toUpperCase()} SECTION. WOULD YOU LIKE A GUIDED WALKTHROUGH?`,
        );

        if (!isMounted) {
          console.log(
            "[Tour Debug] Component unmounted after dialog, skipping",
          );
          return;
        }

        console.log("[Tour Debug] User response:", result);

        if (result.isConfirmed) {
          console.log("[Tour Debug] User accepted tour, starting...");
          setEnabled(true);
        } else if (result.isDismissed) {
          console.log(
            "[Tour Debug] Dialog dismissed, will ask again next time",
          );
          tourCheckInitiated.current = false;
        } else {
          console.log("[Tour Debug] User declined tour, marking as complete");
          await onExit();
        }
      } catch (error) {
        console.log("[Tour Debug] Error showing dialog:", error);
        tourCheckInitiated.current = false;
      }
    };
    checkTour();

    return () => {
      console.log("[Tour Debug] Cleanup called for", tourKey);
      isMounted = false;
    };
  }, [tourKey, user, hasSeenTour]);

  const options = {
    showProgress: true,
    showBullets: false,
    exitOnOverlayClick: false,
    maskClosable: false,
    nextLabel: "Next",
    prevLabel: "Back",
    doneLabel: "Got it!",
    tooltipClass: "custom-tooltip",
    highlightClass: "custom-highlight",
  };

  return (
    <>
      <style jsx global>{`
        .custom-tooltip {
          background: var(--background) !important;
          color: var(--foreground) !important;
          border: 1px solid var(--foreground) !important;
          border-radius: 0 !important;
          padding: 20px !important;
          font-family: var(--font-sans) !important;
          box-shadow: 10px 10px 0px var(--foreground) !important;
          max-width: 300px !important;
        }
        .introjs-tooltip-title {
          font-family: var(--font-sans) !important;
          font-weight: 900 !important;
          text-transform: uppercase !important;
          letter-spacing: -0.05em !important;
          font-style: italic !important;
          font-size: 1.2rem !important;
          color: var(--foreground) !important;
          margin-bottom: 10px !important;
        }
        .introjs-tooltiptext {
          font-size: 0.8rem !important;
          font-weight: 500 !important;
          line-height: 1.4 !important;
          color: var(--foreground) !important;
          opacity: 0.8 !important;
        }
        .introjs-button {
          background: transparent !important;
          color: var(--foreground) !important;
          border: 1px solid var(--foreground) !important;
          border-radius: 0 !important;
          text-shadow: none !important;
          font-size: 10px !important;
          font-weight: 900 !important;
          text-transform: uppercase !important;
          transition: all 0.2s ease !important;
          padding: 8px 15px !important;
        }
        .introjs-button:hover {
          background: var(--foreground) !important;
          color: var(--background) !important;
        }
        .introjs-disabled {
          opacity: 0.3 !important;
          cursor: not-allowed !important;
        }
        .introjs-progress {
          background-color: rgba(0, 0, 0, 0.1) !important;
          height: 4px !important;
          border-radius: 0 !important;
        }
        .introjs-progressbar {
          background-color: var(--foreground) !important;
        }
        .introjs-arrow {
          border-bottom-color: var(--foreground) !important;
        }
        .custom-highlight {
          border: 2px solid var(--foreground) !important;
          box-shadow: 0 0 0 9999px rgba(255, 255, 255, 0.8) !important;
        }
        [data-theme="dark"] .custom-highlight {
          box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.8) !important;
        }
      `}</style>
      <Steps
        key={`${tourKey}-${(user?.completedTours || []).length}`}
        enabled={enabled}
        steps={steps}
        initialStep={0}
        onExit={onExit}
        options={options}
      />
    </>
  );
}
