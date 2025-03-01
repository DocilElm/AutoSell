import { Keybind } from "../KeybindFix"
import PogObject from "../PogData"

const data = new PogObject("AutoSell", {
    names: [],
    ids: [],
    delay: 250, // in milliseconds
    toggle: false
})
/** @type {KeyBind}/ */
const nameKeybind = new Keybind("Add Item Name", Keyboard.KEY_NONE, "AutoSell")
/** @type {KeyBind}/ */
const idKeybind = new Keybind("Add Item ID", Keyboard.KEY_NONE, "AutoSell")

let clicking = false

/**
 * - Checks whether the item has stars or the rarity has been upgraded (recomb)
 * @param {MCTItemStack} itemStack
 */
const hasUpgrades = (itemStack) => {
    if (!itemStack) return

    const extraAttributes = itemStack./* getTagCompound */func_77978_p()./* getTag */func_74781_a("ExtraAttributes")
    const rarityUpgrades = extraAttributes./* getInteger */func_74762_e("rarity_upgrades")
    const upgradeLevel = extraAttributes./* getInteger */func_74762_e("upgrade_level")
    const dungeonItemLevel = extraAttributes./* getInteger */func_74762_e("dungeon_item_level")

    return (rarityUpgrades || upgradeLevel || dungeonItemLevel)
}

const getItemName = (itemStack) => {
    if (!itemStack) return
    const reforge = itemStack./* getTagCompound */func_77978_p()./* getTag */func_74781_a("ExtraAttributes")./* getString */func_74779_i("modifier")
    const name = itemStack./* getDisplayName */func_82833_r()?.removeFormatting()?.replace(/x\d+$/, "")

    const m = name.match(/([A-z ]+)/)
    if (!m) return

    return m[1]?.toLowerCase()?.replace(reforge, "")?.trim()
}

const getItemId = (itemStack) => {
    if (!itemStack) return

    return itemStack./* getTagCompound */func_77978_p()./* getTag */func_74781_a("ExtraAttributes")./* getString */func_74779_i("id")
}

const doNameSaving = (gui) => {
    const slot = gui.getSlotUnderMouse()
    const itemStack = slot./* getStack */func_75211_c()
    const trimmed = getItemName(itemStack)
    if (!trimmed) return

    const listIdx = data.names.findIndex((it) => it === trimmed)
    if (listIdx !== -1) {
        data.names.splice(listIdx, 1)
        ChatLib.chat(`&8[&cAuto Sell&8] &cRemoved &6${trimmed} &cfrom the auto sell name list`)
        return
    }

    data.names.push(trimmed)
    ChatLib.chat(`&8[&cAuto Sell&8] &bAdded &6${trimmed} &bto the auto sell name list`)
}

register("guiKey", (_, keycode, gui) => {
    if (!(gui instanceof net.minecraft.client.gui.inventory.GuiInventory || gui instanceof net.minecraft.client.gui.inventory.GuiChest))
        return

    if (nameKeybind.getKeyCode() !== 0 && keycode === nameKeybind.getKeyCode())
        return doNameSaving(gui)
    if (idKeybind.getKeyCode() === 0) return
    if (keycode !== idKeybind.getKeyCode()) return

    const slot = gui.getSlotUnderMouse()
    const itemStack = slot./* getStack */func_75211_c()
    const itemId = getItemId(itemStack)
    if (!itemId) return

    const listIdx = data.ids.findIndex((it) => it === itemId)
    if (listIdx !== -1) {
        data.ids.splice(listIdx, 1)
        ChatLib.chat(`&8[&cAuto Sell&8] &cRemoved &6${itemId} &cfrom the auto sell id list`)
        return
    }

    data.ids.push(itemId)
    ChatLib.chat(`&8[&cAuto Sell&8] &bAdded &6${itemId} &bto the auto sell id list`)
})

register("tick", () => {
    if (!data.toggle) return
    const container = Player.getContainer()
    if (container.getName() !== "Trades") return

    const items = container.getItems()
    if (items[49]?.getID() === 166) return

    items.forEach((it, idx) => {
        if (clicking || !it || idx <= 53) return

        const trimmedName = getItemName(it.itemStack)
        const itemId = getItemId(it.itemStack)
        if (hasUpgrades(it.itemStack)) return

        if (
            data.names.find((it) => it === trimmedName) ||
            data.ids.find((it) => it === itemId)
            ) {
                clicking = true
                container.drop(idx, true)
                setTimeout(() => {
                    clicking = false
                }, data.delay)
            }
    })
})

register("command", (delay) => {
    const d = parseInt(delay)
    if (Number.isNaN(d)) {
        data.toggle = !data.toggle
        ChatLib.chat(`&8[&cAuto Sell&8] &bToggled ${data.toggle ? "&aOn" : "&cOff"}`)
        return
    }

    data.delay = d
    ChatLib.chat(`&8[&cAuto Sell&8] &bSet delay to &6${delay}ms`)
}).setName("/ac")

register("worldUnload", () => {
    clicking = false
})

register("gameUnload", () => {
    data.save()
})