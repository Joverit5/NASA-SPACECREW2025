// ========== BUDGET SYSTEM ==========


class BudgetSystem {
  constructor(scene) {
    this.scene = scene
    this.totalBudget = 100000
    this.remainingBudget = 100000
    this.lowBudgetThreshold = 20000
    
    // meaningful costs for different area types
    this.areaCosts = {
      Dock: { base: 20000, importance: 1.5 },
      Control: { base: 15000, importance: 1.4 },
      Energy: { base: 14000, importance: 1.4 },
      Medbay: { base: 10000, importance: 1.2 },
      Lab: { base: 9500, importance: 1.1 },
      Biodome: { base: 11000, importance: 1.3 },
      Oxygen: { base: 8500, importance: 1.1 },
      Kitchen: { base: 8000, importance: 1.0 },
      Maintenance: { base: 7000, importance: 1.0 },
      Psychology: { base: 6500, importance: 0.9 },
      Sleep: { base: 6000, importance: 0.8 },
      Storage: { base: 4500, importance: 0.7 },
      Observatory: { base: 12000, importance: 1.3 },
    }
    

    this.budgetDisplay = null
    this.warningText = null
    this.tooltipContainer = null
    this.flashTween = null
    

  
    this.createBudgetDisplay()
  }
  
  /**
   * Calcular el costo de un área basado en tipo, tamaño y misiones
   * Formula: base × importance × (width × height × 0.8) × (1 + missions × 0.05) / 10
   */
  calculateAreaCost(type, width, height, missions = 0) {
    const config = this.areaCosts[type] || { base: 5000, importance: 1.0 }
    const baseCost = config.base
    const importance = config.importance
    const sizeFactor = width * height * 0.8
    const missionFactor = 1 + (missions * 0.05)
    
    const totalCost = Math.floor((baseCost * importance * sizeFactor * missionFactor) / 10)
    return totalCost
  }
  
  /**
   * Verificar si el jugador puede pagar un área
   */
  canAfford(type, width, height, missions = 0) {
    const cost = this.calculateAreaCost(type, width, height, missions)
    return this.remainingBudget >= cost
  }
  
  /**
   * Intentar comprar un área
   * Retorna true si la compra fue exitosa, false si no hay fondos
   */
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
  
  /**
   * Refund - devolver créditos al presupuesto (para undo/redo)
   */
  refund(type, width, height, missions = 0) {
    const cost = this.calculateAreaCost(type, width, height, missions)
    this.remainingBudget = Math.min(this.totalBudget, this.remainingBudget + cost)
    this.updateDisplay()
    this.checkLowBudget()
  }
  
  /**
   * Crear el display del presupuesto en la esquina superior izquierda
   */
  createBudgetDisplay() {
    const padding = 20
    const y = padding
    
    // Container para el presupuesto
    this.budgetContainer = this.scene.add.container(padding, y)
    this.budgetContainer.setScrollFactor(0)
    this.budgetContainer.setDepth(9000)
    
    // Fondo oscuro con brillo
    const bg = this.scene.add.graphics()
    bg.fillStyle(0x0a0e27, 0.9)
    bg.fillRoundedRect(0, 0, 220, 50, 8)
    bg.lineStyle(2, 0xFFD700, 1)
    bg.strokeRoundedRect(0, 0, 220, 50, 8)
    this.budgetContainer.add(bg)
    
    // Ícono de créditos
    const icon = this.scene.add.text(12, 25, '💳', {
      fontSize: '24px',
    }).setOrigin(0, 0.5)
    this.budgetContainer.add(icon)
    
    // Texto del presupuesto
    this.budgetDisplay = this.scene.add.text(45, 25, this.formatCredits(this.remainingBudget), {
      fontFamily: 'Orbitron, monospace',
      fontSize: '20px',
      color: '#FFD700',
      fontStyle: 'bold',
    }).setOrigin(0, 0.5)
    this.budgetContainer.add(this.budgetDisplay)
    
    // Guardar referencia al fondo para animaciones
    this.budgetBg = bg
  }
  
  /**
   * Actualizar el display del presupuesto
   */
  updateDisplay() {
    if (this.budgetDisplay) {
      this.budgetDisplay.setText(this.formatCredits(this.remainingBudget))
      
      // Cambiar color si es bajo
      if (this.remainingBudget < this.lowBudgetThreshold) {
        this.budgetDisplay.setColor('#FF4444')
      } else {
        this.budgetDisplay.setColor('#FFD700')
      }
    }
  }
  
  /**
   * Formatear créditos con separador de miles y símbolo
   */
  formatCredits(amount) {
    return amount.toLocaleString('en-US') + '₵'
  }
  
  /**
   * Verificar si el presupuesto es bajo y mostrar advertencia
   */
  checkLowBudget() {
    if (this.remainingBudget < this.lowBudgetThreshold && this.remainingBudget > 0) {
      if (!this.lowBudgetWarningShown) {
        this.showWarning('Low budget warning!', '#FFA500')
        this.lowBudgetWarningShown = true
        
        // Parpadeo del borde
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
  
  /**
   * Mostrar mensaje de advertencia flotante
   */
  showWarning(message, color = '#FF4444') {
    // Remover advertencia anterior si existe
    if (this.warningText) {
      this.warningText.destroy()
    }
    
    const centerX = this.scene.sys.canvas.width / 2
    const centerY = this.scene.sys.canvas.height / 2
    
    // Crear texto de advertencia
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
    
    // Animación de aparición y desvanecimiento
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
  
  /**
   * Efecto de flash rojo
   */
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
  
  /**
   * Mostrar popup de compra exitosa
   */
  showPurchasePopup(type, cost) {
    const centerX = this.scene.sys.canvas.width / 2
    const centerY = this.scene.sys.canvas.height / 2
    
    // Container para el popup
    const popup = this.scene.add.container(centerX, centerY + 80)
    popup.setScrollFactor(0)
    popup.setDepth(10000)
    popup.setAlpha(0)
    popup.setScale(0.8)
    
    // Fondo
    const bg = this.scene.add.graphics()
    bg.fillStyle(0x4CAF50, 0.95)
    bg.fillRoundedRect(-120, -30, 240, 60, 8)
    bg.lineStyle(3, 0x45a049, 1)
    bg.strokeRoundedRect(-120, -30, 240, 60, 8)
    popup.add(bg)
    
    // Texto
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
    
    // Animación de aparición
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
  
  /**
   * Mostrar tooltip con costo del área (durante hover o drag)
   */
  showTooltip(pointer, type, width, height, missions = 0) {
    if (this.tooltipContainer) {
      this.tooltipContainer.destroy()
    }
    
    const cost = this.calculateAreaCost(type, width, height, missions)
    const canBuy = this.canAfford(type, width, height, missions)
    
    this.tooltipContainer = this.scene.add.container(pointer.x + 20, pointer.y - 20)
    this.tooltipContainer.setScrollFactor(0)
    this.tooltipContainer.setDepth(10001)
    
    // Fondo
    const bg = this.scene.add.graphics()
    bg.fillStyle(canBuy ? 0x0a0e27 : 0x2d1f1f, 0.95)
    bg.fillRoundedRect(0, 0, 160, 50, 6)
    bg.lineStyle(2, canBuy ? 0x00d9ff : 0xff4444, 1)
    bg.strokeRoundedRect(0, 0, 160, 50, 6)
    this.tooltipContainer.add(bg)
    
    // Texto
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
  
  /**
   * Ocultar tooltip
   */
  hideTooltip() {
    if (this.tooltipContainer) {
      this.tooltipContainer.destroy()
      this.tooltipContainer = null
    }
  }
  
  /**
   * Actualizar posición del tooltip (durante drag)
   */
  updateTooltipPosition(pointer) {
    if (this.tooltipContainer) {
      this.tooltipContainer.x = pointer.x + 20
      this.tooltipContainer.y = pointer.y - 20
    }
  }
  
  /**
   * Reproducir sonido de error
   */
  playErrorSound() {
    try {
      if (this.scene.sound.get('error_sound')) {
        this.scene.sound.play('error_sound', { volume: 0.3 })
      }
    } catch (e) {
      console.warn('[Budget] Error playing sound:', e)
    }
  }
  
  /**
   * Reiniciar el presupuesto (útil para reiniciar el juego)
   */
  reset() {
    this.remainingBudget = this.totalBudget
    this.lowBudgetWarningShown = false
    this.updateDisplay()
  }
  
  /**
   * Destruir el sistema de presupuesto
   */
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