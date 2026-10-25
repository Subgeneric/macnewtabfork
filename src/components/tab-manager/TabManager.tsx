import {
  ChangeEvent,
  memo,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ReactComponent as CloseIcon } from "./close-icon.svg";
import { ReactComponent as MutedIcon } from "./muted.svg";
import { ReactComponent as UnmutedIcon } from "./unmuted.svg";
import EmptySiteImage from "./empty-site-image.png";
import "./TabManager.css";
import Translation from "../../locale/Translation";
import { AppContext } from "../../context/provider";
import { translation } from "../../locale/languages";
import { createHoverPanel } from "../../utils/hoverPanel";
import { useReducedMotion } from "../../utils/useReducedMotion";

const getGroupedTabs = (tabs: chrome.tabs.Tab[], search: string) => {
  return tabs.reduce((prev: Record<number, chrome.tabs.Tab[]>, current) => {
    if (
      search &&
      !current.title?.toLowerCase()?.includes(search.toLowerCase()) &&
      !current.url?.toLowerCase()?.includes(search.toLowerCase())
    ) {
      return prev;
    }

    const windowId = current.windowId;

    const groupedTabs = prev[windowId] || [];
    groupedTabs.push(current);

    return {
      ...prev,
      [windowId]: groupedTabs,
    };
  }, {});
};

const TabManager = memo(() => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [tabList, setTabList] = useState<chrome.tabs.Tab[]>([]);
  const { locale } = useContext(AppContext);

  const searchRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const anchorRef = useRef<HTMLButtonElement>(null);

  // Hover to open / leave to close is on unless motion is reduced; with
  // reduced motion the panel keeps its classic click-to-open behaviour.
  const hoverMode = !useReducedMotion();
  // Opened by hovering: don't steal keyboard focus from whatever the person
  // was typing in. Cleared again whenever the panel closes.
  const focusSearchOnOpen = useRef(true);
  const closeOnLeave = useRef(false);

  const hover = useMemo(
    () =>
      createHoverPanel({
        open: () => {
          focusSearchOnOpen.current = false;
          closeOnLeave.current = true;
          setOpen(true);
        },
        close: () => setOpen(false),
        // Keep the panel while a search is typed in
        canClose: () => !searchRef.current?.value,
      }),
    [],
  );
  useEffect(() => {
    if (!hoverMode) hover.cancel();
    return () => hover.cancel();
  }, [hover, hoverMode]);
  useEffect(() => {
    if (!open) {
      focusSearchOnOpen.current = true;
      closeOnLeave.current = false;
    }
  }, [open]);

  useEffect(() => {
    const timerRef = setTimeout(() => {
      setDebouncedSearch(search);
    }, 200);

    return () => clearTimeout(timerRef);
  }, [search]);

  const groupedTabs = useMemo(() => {
    return getGroupedTabs(tabList as chrome.tabs.Tab[], debouncedSearch);
  }, [tabList, debouncedSearch]);

  useEffect(() => {
    if (open) {
      if (focusSearchOnOpen.current) searchRef.current?.focus();

      handleUpdateTabList();
      setSearch("");

      const handleTabUpdate = (
        _tabId: number,
        _tabChange: chrome.tabs.TabChangeInfo,
        tab: chrome.tabs.Tab,
      ) => {
        if (tab.status === "complete") {
          handleUpdateTabList();
        }
      };

      const handleTabRemove = () => {
        handleUpdateTabList();
      };

      const handleEsc = (event: KeyboardEvent) => {
        if (event.key === "Escape") {
          setOpen(false);
        }
      };

      chrome.tabs?.onUpdated.addListener(handleTabUpdate);
      chrome.tabs?.onRemoved.addListener(handleTabRemove);
      document.addEventListener("keydown", handleEsc);

      return () => {
        chrome.tabs?.onUpdated.removeListener(handleTabUpdate);
        chrome.tabs?.onRemoved.removeListener(handleTabRemove);
        document.removeEventListener("keydown", handleEsc);
      };
    }
  }, [open, searchRef]);

  const hasAllTabsMmuted = useMemo(() => {
    return tabList
      .filter((tab) => tab.audible)
      .every((tab) => tab.mutedInfo?.muted);
  }, [tabList]);

  const hasAudibleTab = useMemo(() => {
    return tabList.some((tab) => tab.audible);
  }, [tabList]);

  // Keyboard shortcut (see utils/keybinds) toggles the panel via this event
  useEffect(() => {
    const toggle = () => setOpen((prev) => !prev);
    window.addEventListener("toggleTabManager", toggle);
    return () => window.removeEventListener("toggleTabManager", toggle);
  }, []);

  const handleOpen = (event: React.MouseEvent<HTMLElement, MouseEvent>) => {
    event.stopPropagation();
    closeOnLeave.current = hoverMode;
    setOpen(true);
  };

  // While open from a hover (or a click in hover mode), leaving the panel
  // closes it. The pull-tab counts as part of the panel, so resting on it
  // keeps the panel open. Panels opened another way stay until dismissed.
  const handlePointerMove = (event: React.MouseEvent<HTMLElement>) => {
    if (!hoverMode || !open || !closeOnLeave.current) return;
    const target = event.target as Node;
    if (
      panelRef.current?.contains(target) ||
      anchorRef.current?.contains(target)
    )
      hover.overPanel();
    else hover.outsidePanel();
  };
  const handlePointerLeave = () => {
    if (hoverMode && open && closeOnLeave.current) hover.outsidePanel();
  };

  const handleRemoveTab = (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    id?: number,
  ) => {
    event.stopPropagation();
    if (!id) {
      return;
    }
    try {
      chrome?.tabs?.remove(id);
    } catch (error) {
      console.error(error);
    }
  };

  const handleUpdateTabList = () => {
    try {
      chrome?.tabs?.query({}, (tabs: chrome.tabs.Tab[]) => {
        setTabList(tabs);
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleFocusTab = (tab: chrome.tabs.Tab) => {
    if (tab.id) {
      try {
        chrome?.tabs?.update(tab.id, { active: true });
        chrome?.windows?.update(tab.windowId, { focused: true });
      } catch (error) {
        console.error(error);
      }
    }
  };

  const handleToggleMute = (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    tab: chrome.tabs.Tab,
  ) => {
    event.stopPropagation();

    if (tab.id && tab.mutedInfo) {
      try {
        chrome?.tabs?.update(tab.id, { muted: !tab.mutedInfo.muted });
      } catch (error) {
        console.error(error);
      }
    }
  };

  const handleToggleMuteOrUnmuteAll = () => {
    const updateMuteState = !hasAllTabsMmuted;

    tabList.forEach((tab) => {
      if (tab.audible && tab.id) {
        chrome?.tabs?.update(tab.id, { muted: updateMuteState });
      }
    });
  };

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLDivElement>,
    tab: chrome.tabs.Tab,
  ) => {
    if (event.key === "Enter") {
      handleFocusTab(tab);
    }
  };

  const handleSearch = (evt: ChangeEvent<HTMLInputElement>) => {
    setSearch(evt.target.value);
  };

  const handleCloseAll = async () => {
    try {
      const [currentTab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      const tabGroups = Object.values(groupedTabs);

      const tabsToClose = [];
      for (let i = 0; i < tabGroups.length; i++) {
        for (let j = 0; j < tabGroups[i].length; j++) {
          const tab = tabGroups[i][j];
          if (tab.id && tab.id !== currentTab?.id) {
            tabsToClose.push(tab.id);
          }
        }
      }

      await chrome.tabs.remove(tabsToClose);
    } catch (error) {
      console.error(error);
    }
  };

  const handleMergeAllTabs = () => {
    try {
      chrome?.windows?.getAll({ populate: true }, function (windows) {
        if (windows.length <= 1) return;

        const mainWindow = windows[0];
        const mainWindowId = mainWindow.id;

        if (!mainWindowId) return;

        windows.slice(1).forEach((window) => {
          if (!window.id) {
            return;
          }
          window?.tabs?.forEach((tab) => {
            if (tab?.id) {
              chrome.tabs.move(tab.id, { windowId: mainWindowId, index: -1 });
            }
          });

          chrome.windows.remove(window.id);
        });

        chrome.windows.update(mainWindowId, { focused: true });

        setTimeout(() => {
          handleUpdateTabList();
        }, 10);
      });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <aside
      className={"tab-manager__overlay" + (open ? " open" : "")}
      onClick={() => setOpen(false)}
      onMouseMove={handlePointerMove}
      onMouseLeave={handlePointerLeave}
    >
      <section
        ref={panelRef}
        className={"tab-manager__content" + (open ? " open" : "")}
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="tab-manager__header">
          <Translation value="tab_manager" />
        </h2>
        <div className="tab-manager__search-container">
          <input
            id="search-tabs"
            name="Search Tabs"
            ref={searchRef}
            value={search}
            placeholder={translation[locale]["search_tabs"]}
            onChange={handleSearch}
            tabIndex={open ? 0 : -1}
          />
        </div>
        <div className="tab-manager__cta">
          {Object.keys(groupedTabs).length > 1 && (
            <button
              className="button break-word"
              onClick={handleMergeAllTabs}
              tabIndex={open ? 0 : -1}
            >
              <Translation value="merge_all" />
            </button>
          )}
          {hasAudibleTab && (
            <button
              className="button break-word"
              onClick={handleToggleMuteOrUnmuteAll}
              tabIndex={open ? 0 : -1}
            >
              {hasAllTabsMmuted ? (
                <Translation value="unmute_all" />
              ) : (
                <Translation value="mute_all" />
              )}
            </button>
          )}
          <button
            className="button break-word"
            onClick={handleCloseAll}
            tabIndex={open ? 0 : -1}
          >
            {debouncedSearch ? (
              <Translation value="close_filtered" />
            ) : (
              <Translation value="close_all" />
            )}
          </button>
        </div>
        <div className="tab-manager__tab-list-container">
          {Object.entries(groupedTabs).map(
            ([windowId, groupedTabList], idx) => {
              return (
                <div key={windowId}>
                  <h2 className="tab-manager__tab-group-title">
                    <Translation value="window" /> {idx + 1} (
                    {groupedTabList.length} <Translation value="tabs" />)
                  </h2>
                  {groupedTabList.map((tab) => (
                    <div
                      className={
                        "tab-manager__tab-list" +
                        (tab.audible ? " has-mute-button" : "")
                      }
                      key={tab.id}
                      tabIndex={open ? 0 : -1}
                      onKeyDown={(event) => handleKeyDown(event, tab)}
                      onClick={() => handleFocusTab(tab)}
                    >
                      <div className="tab-manager__tab-info">
                        <img
                          className="tab-manager__tab-icon"
                          src={tab.favIconUrl || EmptySiteImage}
                          alt={tab.title}
                        />
                        <div>
                          <h4
                            className="tab-manager__tab-title"
                            title={tab.title}
                          >
                            {tab.title}
                          </h4>
                          <h5
                            className="tab-manager__tab-description"
                            title={tab.url}
                          >
                            {tab.url}
                          </h5>
                        </div>
                      </div>
                      {tab.audible && (
                        <button
                          className="tab-manager__tab-toggle-mute"
                          onKeyDown={(event) =>
                            event.key === "Enter" && event.stopPropagation()
                          }
                          onClick={(event) => handleToggleMute(event, tab)}
                        >
                          {tab.mutedInfo?.muted ? (
                            <MutedIcon />
                          ) : (
                            <UnmutedIcon />
                          )}
                        </button>
                      )}
                      <button
                        className="tab-manager__tab-close"
                        onKeyDown={(event) =>
                          event.key === "Enter" && event.stopPropagation()
                        }
                        onClick={(event) => handleRemoveTab(event, tab.id)}
                      >
                        <CloseIcon />
                      </button>
                    </div>
                  ))}
                </div>
              );
            },
          )}
        </div>
      </section>
      <button
        ref={anchorRef}
        className="tab-manager__anchor"
        onClick={handleOpen}
        onMouseEnter={hoverMode ? hover.enterTrigger : undefined}
        onMouseLeave={hoverMode ? hover.leaveTrigger : undefined}
      >
        <div className="tab-manager__anchor-bar"></div>
      </button>
    </aside>
  );
});

export default TabManager;
