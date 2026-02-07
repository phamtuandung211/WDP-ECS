import Customer from "../models/Customer.js";
import Doctor from "../models/Doctor.js";
import SaleStaff from "../models/SaleStaff.js";
import CustomerSupport from "../models/CustomerSupport.js";
import { ROLE_NAME } from "./Role.enum.js";

export const PROFILE_MODEL_BY_ROLE = {
  [ROLE_NAME.CUSTOMER]: Customer,
  [ROLE_NAME.DOCTOR]: Doctor,
  [ROLE_NAME.SALE_STAFF]: SaleStaff,
  [ROLE_NAME.CUSTOMER_SUPPORT]: CustomerSupport,
};
