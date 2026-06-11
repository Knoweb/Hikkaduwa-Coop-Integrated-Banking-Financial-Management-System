package com.hmcs.savings.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

@Entity
public class SavingsAccountType {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String code;
    private String nameEn;
    private String nameSi;
    
    @jakarta.persistence.Column(name = "is_child_account")
    private Boolean isChildAccount = false;

    @jakarta.persistence.Column(name = "interest_rate", precision = 5, scale = 4)
    private java.math.BigDecimal interestRate = new java.math.BigDecimal("0.0400"); // Default 4%

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getNameEn() {
        return nameEn;
    }

    public void setNameEn(String nameEn) {
        this.nameEn = nameEn;
    }

    public String getNameSi() {
        return nameSi;
    }

    public void setNameSi(String nameSi) {
        this.nameSi = nameSi;
    }

    public Boolean getIsChildAccount() {
        return isChildAccount;
    }

    public void setIsChildAccount(Boolean isChildAccount) {
        this.isChildAccount = isChildAccount;
    }

    public java.math.BigDecimal getInterestRate() {
        return interestRate;
    }

    public void setInterestRate(java.math.BigDecimal interestRate) {
        this.interestRate = interestRate;
    }
}
