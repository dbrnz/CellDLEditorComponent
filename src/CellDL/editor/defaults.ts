//==============================================================================
//==============================================================================

import type { ViewState } from "#root/utils/editor-types"

import { GRID_SNAP_RESOLUTION, GRID_SPACING, type GridOptions } from "./editguides"

//==============================================================================

// Needs to match what's passed to the CellDLEditor component as `viewState`

export const defaultGridOptions: GridOptions = {
    gridSpacing: GRID_SPACING,
    resolution: GRID_SNAP_RESOLUTION,
    snapGrid: true,
    fullSnap: true,
}

export const DEFAULT_VIEW_STATE: ViewState = {
    showGrid: true,
    gridSpacing: GRID_SPACING,
    snapToGrid: defaultGridOptions.snapGrid ? (defaultGridOptions.fullSnap ? 1 : 0.5) : 0,
    alignmentGuides: true
}

//==============================================================================
