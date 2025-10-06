// ========== BUDGET SYSTEM ==========

class BudgetSystem {
  constructor(scene) {
    this.scene = scene
    this.totalBudget = 100000
    this.remainingBudget = 100000
    this.lowBudgetThreshold = 20000
    
    this.areaCosts = {
      Dock: { base: 50000, importance: 1.5 },
      Control: { base: 45000, importance: 1.4 },
      Energy: { base: 44000, importance: 1.4 },
      Medbay: { base: 40000, importance: 1.2 },
      Lab: { base: 35000, importance: 1.1 },
      Biodome: { base: 41000, importance: 1.3 },
      Oxygen: { base: 38500, importance: 1.1 },
      Kitchen: { base: 38000, importance: 1.0 },
      Maintenance: { base: 37000, importance: 1.0 },
      Psychology: { base: 36500, importance: 0.9 },
      Sleep: { base: 36000, importance: 0.8 },
      Storage: { base: 34500, importance: 0.7 },
      Observatory: { base: 52000, importance: 1.3 },
    }

    this.budgetDisplay = null
    this.warningText = null
    this.tooltipContainer = null
    this.flashTween = null
  
    this.createBudgetDisplay()
  }
  
  calculateAreaCost(type, width, height, missions = 0) {
    const config = this.areaCosts[type] || { base: 5000, importance: 1.0 }
    const baseCost = config.base
    const importance = config.importance
    const sizeFactor = width * height * 0.8
    const missionFactor = 1 + (missions * 0.05)
    
    const totalCost = Math.floor((baseCost * importance * sizeFactor * missionFactor) / 10)
    return totalCost
  }
  
  canAfford(type, width, height, missions = 0) {
    const cost = this.calculateAreaCost(type, width, height, missions)
    return this.remainingBudget >= cost
  }
  
  purchase(type, width, height, missions = 0) {
    const cost = this.calculateAreaCost(type, width, height, missions)
    
    if (this.remainingBudget >= cost) {
      this.remainingBudget -= cost
      this.updateDisplay()
      this.showPurchasePopup(type, cost)
      this.checkLowBudget()
      return true
    } else {
      this.showWarning('Insufficient credits!')
      this.flashRed()
      this.playErrorSound()
      return false
    }
  }
  
  refund(type, width, height, missions = 0) {
    const cost = this.calculateAreaCost(type, width, height, missions)
    this.remainingBudget = Math.min(this.totalBudget, this.remainingBudget + cost)
    this.updateDisplay()
    this.checkLowBudget()
  }
  
  createBudgetDisplay() {
    const padding = 20
    const y = padding
    
    this.budgetContainer = this.scene.add.container(padding, y)
    this.budgetContainer.setScrollFactor(0)
    this.budgetContainer.setDepth(9000)
    
    const bg = this.scene.add.graphics()
    bg.fillStyle(0x0a0e27, 0.9)
    bg.fillRoundedRect(0, 0, 220, 50, 8)
    bg.lineStyle(2, 0xFFD700, 1)
    bg.strokeRoundedRect(0, 0, 220, 50, 8)
    this.budgetContainer.add(bg)
    
    const icon = this.scene.add.text(12, 25, '💳', {
      fontSize: '24px',
    }).setOrigin(0, 0.5)
    this.budgetContainer.add(icon)
    
    this.budgetDisplay = this.scene.add.text(45, 25, this.formatCredits(this.remainingBudget), {
      fontFamily: 'Orbitron, monospace',
      fontSize: '20px',
      color: '#FFD700',
      fontStyle: 'bold',
    }).setOrigin(0, 0.5)
    this.budgetContainer.add(this.budgetDisplay)
    
    this.budgetBg = bg
  }
  
  updateDisplay() {
    if (this.budgetDisplay) {
      this.budgetDisplay.setText(this.formatCredits(this.remainingBudget))
      
      if (this.remainingBudget < this.lowBudgetThreshold) {
        this.budgetDisplay.setColor('#FF4444')
      } else {
        this.budgetDisplay.setColor('#FFD700')
      }
    }
  }
  
  formatCredits(amount) {
    return amount.toLocaleString('en-US') + '₵'
  }
  
  checkLowBudget() {
    if (this.remainingBudget < this.lowBudgetThreshold && this.remainingBudget > 0) {
      if (!this.lowBudgetWarningShown) {
        this.showWarning('Low budget warning!', '#FFA500')
        this.lowBudgetWarningShown = true
        
        if (this.flashTween) this.flashTween.stop()
        this.flashTween = this.scene.tweens.add({
          targets: this.budgetBg,
          alpha: 0.5,
          duration: 500,
          yoyo: true,
          repeat: 3,
        })
      }
    } else {
      this.lowBudgetWarningShown = false
    }
  }
  
  showWarning(message, color = '#FF4444') {
    if (this.warningText) {
      this.warningText.destroy()
    }
    
    const centerX = this.scene.sys.canvas.width / 2
    const centerY = this.scene.sys.canvas.height / 2
    
    this.warningText = this.scene.add.text(centerX, centerY - 50, message, {
      fontFamily: 'Orbitron, monospace',
      fontSize: '24px',
      color: color,
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5)
    this.warningText.setScrollFactor(0)
    this.warningText.setDepth(10000)
    this.warningText.setAlpha(0)
    
    this.scene.tweens.add({
      targets: this.warningText,
      alpha: 1,
      y: centerY - 70,
      duration: 300,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.scene.tweens.add({
          targets: this.warningText,
          alpha: 0,
          y: centerY - 90,
          duration: 400,
          delay: 1500,
          ease: 'Power2',
          onComplete: () => {
            if (this.warningText) {
              this.warningText.destroy()
              this.warningText = null
            }
          }
        })
      }
    })
  }
  
  flashRed() {
    if (this.flashOverlay) {
      this.flashOverlay.destroy()
    }
    
    this.flashOverlay = this.scene.add.graphics()
    this.flashOverlay.setScrollFactor(0)
    this.flashOverlay.setDepth(9999)
    this.flashOverlay.fillStyle(0xFF0000, 0.3)
    this.flashOverlay.fillRect(0, 0, this.scene.sys.canvas.width, this.scene.sys.canvas.height)
    
    this.scene.tweens.add({
      targets: this.flashOverlay,
      alpha: 0,
      duration: 400,
      ease: 'Power2',
      onComplete: () => {
        if (this.flashOverlay) {
          this.flashOverlay.destroy()
          this.flashOverlay = null
        }
      }
    })
  }
  
  showPurchasePopup(type, cost) {
    const centerX = this.scene.sys.canvas.width / 2
    const centerY = this.scene.sys.canvas.height / 2
    
    const popup = this.scene.add.container(centerX, centerY + 80)
    popup.setScrollFactor(0)
    popup.setDepth(10000)
    popup.setAlpha(0)
    popup.setScale(0.8)
    
    const bg = this.scene.add.graphics()
    bg.fillStyle(0x4CAF50, 0.95)
    bg.fillRoundedRect(-120, -30, 240, 60, 8)
    bg.lineStyle(3, 0x45a049, 1)
    bg.strokeRoundedRect(-120, -30, 240, 60, 8)
    popup.add(bg)
    
    const text = this.scene.add.text(0, -10, `${type} purchased`, {
      fontFamily: 'Orbitron, monospace',
      fontSize: '16px',
      color: '#FFFFFF',
      fontStyle: 'bold',
    }).setOrigin(0.5)
    popup.add(text)
    
    const costText = this.scene.add.text(0, 10, `-${this.formatCredits(cost)}`, {
      fontFamily: 'Orbitron, monospace',
      fontSize: '14px',
      color: '#FFEB3B',
    }).setOrigin(0.5)
    popup.add(costText)
    
    this.scene.tweens.add({
      targets: popup,
      alpha: 1,
      scale: 1,
      duration: 300,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.scene.tweens.add({
          targets: popup,
          alpha: 0,
          y: centerY + 60,
          duration: 400,
          delay: 1200,
          ease: 'Power2',
          onComplete: () => popup.destroy()
        })
      }
    })
  }
  
  showTooltip(pointer, type, width, height, missions = 0) {
    if (this.tooltipContainer) {
      this.tooltipContainer.destroy()
    }
    
    const cost = this.calculateAreaCost(type, width, height, missions)
    const canBuy = this.canAfford(type, width, height, missions)
    
    this.tooltipContainer = this.scene.add.container(pointer.x + 20, pointer.y - 20)
    this.tooltipContainer.setScrollFactor(0)
    this.tooltipContainer.setDepth(10001)
    
    const bg = this.scene.add.graphics()
    bg.fillStyle(canBuy ? 0x0a0e27 : 0x2d1f1f, 0.95)
    bg.fillRoundedRect(0, 0, 160, 50, 6)
    bg.lineStyle(2, canBuy ? 0x00d9ff : 0xff4444, 1)
    bg.strokeRoundedRect(0, 0, 160, 50, 6)
    this.tooltipContainer.add(bg)
    
    const titleText = this.scene.add.text(8, 8, type, {
      fontFamily: 'Orbitron, monospace',
      fontSize: '14px',
      color: '#FFFFFF',
      fontStyle: 'bold',
    })
    this.tooltipContainer.add(titleText)
    
    const costText = this.scene.add.text(8, 28, `Cost: ${this.formatCredits(cost)}`, {
      fontFamily: 'Orbitron, monospace',
      fontSize: '12px',
      color: canBuy ? '#FFD700' : '#FF4444',
    })
    this.tooltipContainer.add(costText)
  }
  
  hideTooltip() {
    if (this.tooltipContainer) {
      this.tooltipContainer.destroy()
      this.tooltipContainer = null
    }
  }
  
  updateTooltipPosition(pointer) {
    if (this.tooltipContainer) {
      this.tooltipContainer.x = pointer.x + 20
      this.tooltipContainer.y = pointer.y - 20
    }
  }
  
  playErrorSound() {
    try {
      if (this.scene.sound.get('error_sound')) {
        this.scene.sound.play('error_sound', { volume: 0.3 })
      }
    } catch (e) {
      console.warn('[Budget] Error playing sound:', e)
    }
  }

  hide() {
    if (this.budgetContainer) {
      this.budgetContainer.setVisible(false);
    }
  }
  fadeOut() {
    if (!this.budgetContainer) return;
    
    this.scene.tweens.add({
      targets: this.budgetContainer,
      alpha: 0,
      duration: 600,
      ease: 'Power2',
      onComplete: () => {
        this.budgetContainer.setVisible(false);
      }
    });
  }

  show() {
    if (this.budgetContainer) {
      this.budgetContainer.setVisible(true);
    }
  }
  
  reset() {
    this.remainingBudget = this.totalBudget
    this.lowBudgetWarningShown = false
    this.updateDisplay()
  }
  
  destroy() {
    if (this.budgetContainer) this.budgetContainer.destroy()
    if (this.warningText) this.warningText.destroy()
    if (this.tooltipContainer) this.tooltipContainer.destroy()
    if (this.flashOverlay) this.flashOverlay.destroy()
    if (this.flashTween) this.flashTween.stop()
  }
}

window.BudgetSystem = BudgetSystem;
console.log('[Budget] Budget system loaded');