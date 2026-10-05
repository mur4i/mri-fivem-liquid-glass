local open = false

local function setOpen(state)
    open = state
    SetNuiFocus(state, state)
    SendNUIMessage({ action = 'toggle', open = state })
end

RegisterCommand('glassdemo', function()
    setOpen(not open)
end, false)

RegisterNUICallback('close', function(_, cb)
    setOpen(false)
    cb('ok')
end)
