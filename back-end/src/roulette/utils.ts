import { RouletteBetPlace } from './roulette-bet-place.enum';

export const betPlaceToNumbers: Record<RouletteBetPlace, number[]> = {
  [RouletteBetPlace.ZERO]: [0],
  [RouletteBetPlace._1]: [1],
  [RouletteBetPlace._2]: [2],
  [RouletteBetPlace._3]: [3],
  [RouletteBetPlace._4]: [4],
  [RouletteBetPlace._5]: [5],
  [RouletteBetPlace._6]: [6],
  [RouletteBetPlace._7]: [7],
  [RouletteBetPlace._8]: [8],
  [RouletteBetPlace._9]: [9],
  [RouletteBetPlace._10]: [10],
  [RouletteBetPlace._11]: [11],
  [RouletteBetPlace._12]: [12],
  [RouletteBetPlace._13]: [13],
  [RouletteBetPlace._14]: [14],
  [RouletteBetPlace._15]: [15],
  [RouletteBetPlace._16]: [16],
  [RouletteBetPlace._17]: [17],
  [RouletteBetPlace._18]: [18],
  [RouletteBetPlace._19]: [19],
  [RouletteBetPlace._20]: [20],
  [RouletteBetPlace._21]: [21],
  [RouletteBetPlace._22]: [22],
  [RouletteBetPlace._23]: [23],
  [RouletteBetPlace._24]: [24],
  [RouletteBetPlace._25]: [25],
  [RouletteBetPlace._26]: [26],
  [RouletteBetPlace._27]: [27],
  [RouletteBetPlace._28]: [28],
  [RouletteBetPlace._29]: [29],
  [RouletteBetPlace._30]: [30],
  [RouletteBetPlace._31]: [31],
  [RouletteBetPlace._32]: [32],
  [RouletteBetPlace._33]: [33],
  [RouletteBetPlace._34]: [34],
  [RouletteBetPlace._35]: [35],
  [RouletteBetPlace._36]: [36],

  [RouletteBetPlace._0_3]: [0, 3],
  [RouletteBetPlace._3_6]: [3, 6],
  [RouletteBetPlace._6_9]: [6, 9],
  [RouletteBetPlace._9_12]: [9, 12],
  [RouletteBetPlace._12_15]: [12, 15],
  [RouletteBetPlace._15_18]: [15, 18],
  [RouletteBetPlace._18_21]: [18, 21],
  [RouletteBetPlace._21_24]: [21, 24],
  [RouletteBetPlace._24_27]: [24, 27],
  [RouletteBetPlace._27_30]: [27, 30],
  [RouletteBetPlace._30_33]: [30, 33],
  [RouletteBetPlace._33_36]: [33, 36],
  [RouletteBetPlace._0_2]: [0, 2],
  [RouletteBetPlace._2_5]: [2, 5],
  [RouletteBetPlace._5_8]: [5, 8],
  [RouletteBetPlace._8_11]: [8, 11],
  [RouletteBetPlace._11_14]: [11, 14],
  [RouletteBetPlace._14_17]: [14, 17],
  [RouletteBetPlace._17_20]: [17, 20],
  [RouletteBetPlace._20_23]: [20, 23],
  [RouletteBetPlace._23_26]: [23, 26],
  [RouletteBetPlace._26_29]: [26, 29],
  [RouletteBetPlace._29_32]: [29, 32],
  [RouletteBetPlace._32_35]: [32, 35],
  [RouletteBetPlace._0_1]: [0, 1],
  [RouletteBetPlace._1_4]: [1, 4],
  [RouletteBetPlace._4_7]: [4, 7],
  [RouletteBetPlace._7_10]: [7, 10],
  [RouletteBetPlace._10_13]: [10, 13],
  [RouletteBetPlace._13_16]: [13, 16],
  [RouletteBetPlace._16_19]: [16, 19],
  [RouletteBetPlace._19_22]: [19, 22],
  [RouletteBetPlace._22_25]: [22, 25],
  [RouletteBetPlace._25_28]: [25, 28],
  [RouletteBetPlace._28_31]: [28, 31],
  [RouletteBetPlace._31_34]: [31, 34],
  [RouletteBetPlace._1_2]: [1, 2],
  [RouletteBetPlace._2_3]: [2, 3],
  [RouletteBetPlace._4_5]: [4, 5],
  [RouletteBetPlace._5_6]: [5, 6],
  [RouletteBetPlace._7_8]: [7, 8],
  [RouletteBetPlace._8_9]: [8, 9],
  [RouletteBetPlace._10_11]: [10, 11],
  [RouletteBetPlace._11_12]: [11, 12],
  [RouletteBetPlace._13_14]: [13, 14],
  [RouletteBetPlace._14_15]: [14, 15],
  [RouletteBetPlace._16_17]: [16, 17],
  [RouletteBetPlace._17_18]: [17, 18],
  [RouletteBetPlace._19_20]: [19, 20],
  [RouletteBetPlace._20_21]: [20, 21],
  [RouletteBetPlace._22_23]: [22, 23],
  [RouletteBetPlace._23_24]: [23, 24],
  [RouletteBetPlace._25_26]: [25, 26],
  [RouletteBetPlace._26_27]: [26, 27],
  [RouletteBetPlace._28_29]: [28, 29],
  [RouletteBetPlace._29_30]: [29, 30],
  [RouletteBetPlace._31_32]: [31, 32],
  [RouletteBetPlace._32_33]: [32, 33],
  [RouletteBetPlace._34_35]: [34, 35],
  [RouletteBetPlace._35_36]: [35, 36],
  [RouletteBetPlace._0_1_2]: [0, 1, 2],
  [RouletteBetPlace._0_2_3]: [0, 2, 3],
  [RouletteBetPlace._1_2_3]: [1, 2, 3],
  [RouletteBetPlace._4_5_6]: [4, 5, 6],
  [RouletteBetPlace._7_8_9]: [7, 8, 9],
  [RouletteBetPlace._10_11_12]: [10, 11, 12],
  [RouletteBetPlace._13_14_15]: [13, 14, 15],
  [RouletteBetPlace._16_17_18]: [16, 17, 18],
  [RouletteBetPlace._19_20_21]: [19, 20, 21],
  [RouletteBetPlace._22_23_24]: [22, 23, 24],
  [RouletteBetPlace._25_26_27]: [25, 26, 27],
  [RouletteBetPlace._28_29_30]: [28, 29, 30],
  [RouletteBetPlace._31_32_33]: [31, 32, 33],
  [RouletteBetPlace._34_35_36]: [34, 35, 36],
  [RouletteBetPlace._1_2_4_5]: [1, 2, 4, 5],
  [RouletteBetPlace._4_5_7_8]: [4, 5, 7, 8],
  [RouletteBetPlace._7_8_10_11]: [7, 8, 10, 11],
  [RouletteBetPlace._0_1_2_3]: [0, 1, 2, 3],
  [RouletteBetPlace._10_11_13_14]: [10, 11, 13, 14],
  [RouletteBetPlace._13_14_16_17]: [13, 14, 16, 17],
  [RouletteBetPlace._16_17_19_20]: [16, 17, 19, 20],
  [RouletteBetPlace._19_20_22_23]: [19, 20, 22, 23],
  [RouletteBetPlace._22_23_25_26]: [22, 23, 25, 26],
  [RouletteBetPlace._25_26_28_29]: [25, 26, 28, 29],
  [RouletteBetPlace._28_29_31_32]: [28, 29, 31, 32],
  [RouletteBetPlace._31_32_34_35]: [31, 32, 34, 35],
  [RouletteBetPlace._2_3_5_6]: [2, 3, 5, 6],
  [RouletteBetPlace._5_6_8_9]: [5, 6, 8, 9],
  [RouletteBetPlace._8_9_11_12]: [8, 9, 11, 12],
  [RouletteBetPlace._11_12_14_15]: [11, 12, 14, 15],
  [RouletteBetPlace._14_15_17_18]: [14, 15, 17, 18],
  [RouletteBetPlace._17_18_20_21]: [17, 18, 20, 21],
  [RouletteBetPlace._20_21_23_24]: [20, 21, 23, 24],
  [RouletteBetPlace._23_24_26_27]: [23, 24, 26, 27],
  [RouletteBetPlace._26_27_29_30]: [26, 27, 29, 30],
  [RouletteBetPlace._29_30_32_33]: [29, 30, 32, 33],
  [RouletteBetPlace._32_33_35_36]: [32, 33, 35, 36],
  [RouletteBetPlace._1_2_3_4_5_6]: [1, 2, 3, 4, 5, 6],
  [RouletteBetPlace._4_5_6_7_8_9]: [4, 5, 6, 7, 8, 9],
  [RouletteBetPlace._7_8_9_10_11_12]: [7, 8, 9, 10, 11, 12],
  [RouletteBetPlace._10_11_12_13_14_15]: [10, 11, 12, 13, 14, 15],
  [RouletteBetPlace._13_14_15_16_17_18]: [13, 14, 15, 16, 17, 18],
  [RouletteBetPlace._16_17_18_19_20_21]: [16, 17, 18, 19, 20, 21],
  [RouletteBetPlace._19_20_21_22_23_24]: [19, 20, 21, 22, 23, 24],
  [RouletteBetPlace._22_23_24_25_26_27]: [22, 23, 24, 25, 26, 27],
  [RouletteBetPlace._25_26_27_28_29_30]: [25, 26, 27, 28, 29, 30],
  [RouletteBetPlace._28_29_30_31_32_33]: [28, 29, 30, 31, 32, 33],
  [RouletteBetPlace._31_32_33_34_35_36]: [31, 32, 33, 34, 35, 36],
  [RouletteBetPlace.DOZEN_1_TO_12]: Array.from({ length: 12 }, (_, i) => i + 1), // 1-12
  [RouletteBetPlace.DOZEN_13_TO_24]: Array.from({ length: 12 }, (_, i) => i + 13), // 13-24
  [RouletteBetPlace.DOZEN_25_TO_36]: Array.from({ length: 12 }, (_, i) => i + 25), // 25-36

  [RouletteBetPlace.COLUMN_3]: [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34],
  [RouletteBetPlace.COLUMN_2]: [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35],
  [RouletteBetPlace.COLUMN_1]: [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36],

  [RouletteBetPlace._1_TO_18]: Array.from({ length: 18 }, (_, i) => i + 1),
  [RouletteBetPlace._19_TO_36]: Array.from({ length: 18 }, (_, i) => i + 19),
  [RouletteBetPlace.EVEN]: [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36],
  [RouletteBetPlace.ODD]: [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 31, 33, 35],

  [RouletteBetPlace.RED]: [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36],
  [RouletteBetPlace.BLACK]: [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35],
};

export const mapPayoutMultiplier = (betPlace: RouletteBetPlace): number => {
  switch (betPlace) {
    case RouletteBetPlace.BLACK:
    case RouletteBetPlace.RED:
    case RouletteBetPlace.EVEN:
    case RouletteBetPlace.ODD:
    case RouletteBetPlace._1_TO_18:
    case RouletteBetPlace._19_TO_36:
      return 2;

    case RouletteBetPlace.DOZEN_1_TO_12:
    case RouletteBetPlace.DOZEN_13_TO_24:
    case RouletteBetPlace.DOZEN_25_TO_36:
    case RouletteBetPlace.COLUMN_1:
    case RouletteBetPlace.COLUMN_2:
    case RouletteBetPlace.COLUMN_3:
      return 3;

    case RouletteBetPlace._1_2_3_4_5_6:
    case RouletteBetPlace._4_5_6_7_8_9:
    case RouletteBetPlace._7_8_9_10_11_12:
    case RouletteBetPlace._10_11_12_13_14_15:
    case RouletteBetPlace._13_14_15_16_17_18:
    case RouletteBetPlace._16_17_18_19_20_21:
    case RouletteBetPlace._19_20_21_22_23_24:
    case RouletteBetPlace._22_23_24_25_26_27:
    case RouletteBetPlace._25_26_27_28_29_30:
    case RouletteBetPlace._28_29_30_31_32_33:
    case RouletteBetPlace._31_32_33_34_35_36:
      return 6;

    case RouletteBetPlace._0_1_2_3:
    case RouletteBetPlace._1_2_4_5:
    case RouletteBetPlace._4_5_7_8:
    case RouletteBetPlace._7_8_10_11:
    case RouletteBetPlace._10_11_13_14:
    case RouletteBetPlace._13_14_16_17:
    case RouletteBetPlace._16_17_19_20:
    case RouletteBetPlace._19_20_22_23:
    case RouletteBetPlace._22_23_25_26:
    case RouletteBetPlace._25_26_28_29:
    case RouletteBetPlace._28_29_31_32:
    case RouletteBetPlace._31_32_34_35:
    case RouletteBetPlace._2_3_5_6:
    case RouletteBetPlace._5_6_8_9:
    case RouletteBetPlace._8_9_11_12:
    case RouletteBetPlace._11_12_14_15:
    case RouletteBetPlace._14_15_17_18:
    case RouletteBetPlace._17_18_20_21:
    case RouletteBetPlace._20_21_23_24:
    case RouletteBetPlace._23_24_26_27:
    case RouletteBetPlace._26_27_29_30:
    case RouletteBetPlace._29_30_32_33:
    case RouletteBetPlace._32_33_35_36:
      return 9;

    case RouletteBetPlace._0_1_2:
    case RouletteBetPlace._0_2_3:
    case RouletteBetPlace._1_2_3:
    case RouletteBetPlace._4_5_6:
    case RouletteBetPlace._7_8_9:
    case RouletteBetPlace._10_11_12:
    case RouletteBetPlace._13_14_15:
    case RouletteBetPlace._16_17_18:
    case RouletteBetPlace._19_20_21:
    case RouletteBetPlace._22_23_24:
    case RouletteBetPlace._25_26_27:
    case RouletteBetPlace._28_29_30:
    case RouletteBetPlace._31_32_33:
    case RouletteBetPlace._34_35_36:
      return 12;

    case RouletteBetPlace._0_3:
    case RouletteBetPlace._3_6:
    case RouletteBetPlace._6_9:
    case RouletteBetPlace._9_12:
    case RouletteBetPlace._12_15:
    case RouletteBetPlace._15_18:
    case RouletteBetPlace._18_21:
    case RouletteBetPlace._21_24:
    case RouletteBetPlace._24_27:
    case RouletteBetPlace._27_30:
    case RouletteBetPlace._30_33:
    case RouletteBetPlace._33_36:
    case RouletteBetPlace._0_2:
    case RouletteBetPlace._2_5:
    case RouletteBetPlace._5_8:
    case RouletteBetPlace._8_11:
    case RouletteBetPlace._11_14:
    case RouletteBetPlace._14_17:
    case RouletteBetPlace._17_20:
    case RouletteBetPlace._20_23:
    case RouletteBetPlace._23_26:
    case RouletteBetPlace._26_29:
    case RouletteBetPlace._29_32:
    case RouletteBetPlace._32_35:
    case RouletteBetPlace._0_1:
    case RouletteBetPlace._1_4:
    case RouletteBetPlace._4_7:
    case RouletteBetPlace._7_10:
    case RouletteBetPlace._10_13:
    case RouletteBetPlace._13_16:
    case RouletteBetPlace._16_19:
    case RouletteBetPlace._19_22:
    case RouletteBetPlace._22_25:
    case RouletteBetPlace._25_28:
    case RouletteBetPlace._28_31:
    case RouletteBetPlace._31_34:
    case RouletteBetPlace._1_2:
    case RouletteBetPlace._2_3:
    case RouletteBetPlace._4_5:
    case RouletteBetPlace._5_6:
    case RouletteBetPlace._7_8:
    case RouletteBetPlace._8_9:
    case RouletteBetPlace._10_11:
    case RouletteBetPlace._11_12:
    case RouletteBetPlace._13_14:
    case RouletteBetPlace._14_15:
    case RouletteBetPlace._16_17:
    case RouletteBetPlace._17_18:
    case RouletteBetPlace._19_20:
    case RouletteBetPlace._20_21:
    case RouletteBetPlace._22_23:
    case RouletteBetPlace._23_24:
    case RouletteBetPlace._25_26:
    case RouletteBetPlace._26_27:
    case RouletteBetPlace._28_29:
    case RouletteBetPlace._29_30:
    case RouletteBetPlace._31_32:
    case RouletteBetPlace._32_33:
    case RouletteBetPlace._34_35:
    case RouletteBetPlace._35_36:
      return 18;

    case RouletteBetPlace.ZERO:
    case RouletteBetPlace._1:
    case RouletteBetPlace._2:
    case RouletteBetPlace._3:
    case RouletteBetPlace._4:
    case RouletteBetPlace._5:
    case RouletteBetPlace._6:
    case RouletteBetPlace._7:
    case RouletteBetPlace._8:
    case RouletteBetPlace._9:
    case RouletteBetPlace._10:
    case RouletteBetPlace._11:
    case RouletteBetPlace._12:
    case RouletteBetPlace._13:
    case RouletteBetPlace._14:
    case RouletteBetPlace._15:
    case RouletteBetPlace._16:
    case RouletteBetPlace._17:
    case RouletteBetPlace._18:
    case RouletteBetPlace._19:
    case RouletteBetPlace._20:
    case RouletteBetPlace._21:
    case RouletteBetPlace._22:
    case RouletteBetPlace._23:
    case RouletteBetPlace._24:
    case RouletteBetPlace._25:
    case RouletteBetPlace._26:
    case RouletteBetPlace._27:
    case RouletteBetPlace._28:
    case RouletteBetPlace._29:
    case RouletteBetPlace._30:
    case RouletteBetPlace._31:
    case RouletteBetPlace._32:
    case RouletteBetPlace._33:
    case RouletteBetPlace._34:
    case RouletteBetPlace._35:
    case RouletteBetPlace._36:
      return 36;
    default:
      return 0;
  }
};
