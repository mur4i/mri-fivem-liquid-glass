local open = false
local looking = false

-- Left mouse is INPUT_ATTACK; the rest keep weapons and melee quiet while the button is held.
local blockedControls = { 24, 25, 140, 141, 142, 257, 263 }

local function stopLooking()
    looking = false
    SetNuiFocusKeepInput(false)
end

local function setOpen(state)
    open = state
    stopLooking()
    SetNuiFocus(state, state)
    SendNUIMessage({ action = 'toggle', open = state })
end

RegisterCommand('liquidglass', function()
    setOpen(not open)
end, false)

RegisterNUICallback('close', function(_, cb)
    setOpen(false)
    cb('ok')
end)

-- Mouse pressed on empty space: the page keeps focus (so it sees the release) and passes the mouse to the game.
RegisterNUICallback('lookStart', function(_, cb)
    cb('ok')
    if not open or looking then return end
    looking = true
    SetNuiFocusKeepInput(true)

    CreateThread(function()
        while looking do
            for i = 1, #blockedControls do
                DisableControlAction(0, blockedControls[i], true)
            end
            Wait(0)
        end
    end)
end)

RegisterNUICallback('lookEnd', function(_, cb)
    stopLooking()
    cb('ok')
end)
