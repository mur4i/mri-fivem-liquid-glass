local visible = false
local cursor = false

local function sync()
    SendNUIMessage({ action = 'state', visible = visible, cursor = cursor })
end

local function setCursor(state)
    cursor = state
    SetNuiFocus(state, state)
    sync()
end

-- Overlay without focus: walk, drive and turn the camera while the glass reacts.
RegisterCommand('glassshowcase', function()
    visible = not visible
    if not visible and cursor then
        setCursor(false)
        return
    end
    sync()
end, false)

-- Frees the mouse to drag the liquid orb around.
RegisterCommand('glasscursor', function()
    if not visible then
        visible = true
    end
    setCursor(not cursor)
end, false)

RegisterNUICallback('release', function(_, cb)
    setCursor(false)
    cb('ok')
end)
