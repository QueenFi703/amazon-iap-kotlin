package com.example.iapdemo

interface IapService {
    fun registerListener(listener: com.amazon.device.iap.PurchasingListener)
    fun getUserData()
    fun getProductData(skus: Set<String>)
    fun purchase(sku: String)
    fun getPurchaseUpdates(reset: Boolean)
    fun notifyFulfillment(receiptId: String, result: com.amazon.device.iap.model.FulfillmentResult)
}
