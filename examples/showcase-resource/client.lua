local open = false
local looking = false

-- Left mouse is INPUT_ATTACK; the rest keep weapons and melee quiet while the button is held.
local blockedControls = { 24, 25, 140, 141, 142, 257, 263 }

local function setOpen(state)
    open = state
    looking = false
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

-- Mouse pressed on empty space: hand the mouse to the game until the button is released.
RegisterNUICallback('look', function(_, cb)
    cb('ok')
    if not open or looking then return end
    looking = true
    SetNuiFocus(false, false)
    SendNUIMessage({ action = 'looking', state = true })

    CreateThread(function()
        local seen = false
        local frames = 0
        while looking do
            for i = 1, #blockedControls do
                DisableControlAction(0, blockedControls[i], true)
            end
            frames = frames + 1
            if IsDisabledControlPressed(0, 24) then
                seen = true
            elseif seen or frames > 15 then
                looking = false
            end
            Wait(0)
        end
        if open then
            SetNuiFocus(true, true)
            SendNUIMessage({ action = 'looking', state = false })
        end
    end)
end)
