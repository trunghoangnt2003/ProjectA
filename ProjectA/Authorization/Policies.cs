namespace ProjectA.Authorization
{
    public static class Policies
    {
        public const string ProductView = "product.view";
        public const string ProductAdd = "product.add";
        public const string ProductEdit = "product.edit";
        public const string ProductDelete = "product.delete";

        public const string CourtView = "court.view";
        public const string CourtAdd = "court.add";
        public const string CourtEdit = "court.edit";
        public const string CourtDelete = "court.delete";

        public const string CustomerView = "customer.view";
        public const string CustomerAdd = "customer.add";
        public const string CustomerEdit = "customer.edit";
        public const string CustomerDelete = "customer.delete";

        public const string BookingView = "booking.view";
        public const string BookingAdd = "booking.add";
        public const string BookingEdit = "booking.edit";
        public const string BookingDelete = "booking.delete";

        public const string SupplyView = "supply.view";
        public const string SupplyAdd = "supply.add";
        public const string SupplyEdit = "supply.edit";
        public const string SupplyDelete = "supply.delete";

        public const string OrderView = "order.view";
        public const string OrderAdd = "order.add";

        public const string PaymentView = "payment.view";
        public const string PaymentAdd = "payment.add";
        public const string PaymentEdit = "payment.edit";
        public const string PaymentDelete = "payment.delete";
    }
}
