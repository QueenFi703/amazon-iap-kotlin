package com.example.iapdemo

import android.content.Context
import com.amazon.device.iap.PurchasingListener
import com.amazon.device.iap.PurchasingService
import com.amazon.device.iap.model.FulfillmentResult

class RealIapService(private val context: Context) : IapService {
    override fun registerListener(listener: PurchasingListener) {
        PurchasingService.registerListener(context, listener)
    }

    override fun getUserData() {
        PurchasingService.getUserData()
    }

    override fun getProductData(skus: Set<String>) {
        PurchasingService.getProductData(skus)
    }

    override fun purchase(sku: String) {
        PurchasingService.purchase(sku)
    }

    override fun getPurchaseUpdates(reset: Boolean) {
        PurchasingService.getPurchaseUpdates(reset)
    }

    override fun notifyFulfillment(receiptId: String, result: FulfillmentResult) {
        PurchasingService.notifyFulfillment(receiptId, result)
    }
}
