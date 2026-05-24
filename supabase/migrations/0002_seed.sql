-- 初期10大会データ
insert into festivals (name, prefecture, city, lat, lng, official_url, description, ranking_score) values
('大曲の花火', '秋田県', '大仙市', 39.460800, 140.479800, 'https://www.oomagari-hanabi.com', '日本三大花火大会のひとつ。全国花火競技大会として約100年の歴史を誇る。', 100),
('長岡まつり大花火大会', '新潟県', '長岡市', 37.447200, 138.851400, 'https://www.nagaoka-hanabi.com', '日本三大花火大会のひとつ。フェニックスをはじめとした超大型スターマインで有名。', 98),
('諏訪湖祭湖上花火大会', '長野県', '諏訪市', 36.036700, 138.075100, 'https://www.suwako-hanabi.com', '日本三大花火大会のひとつ。諏訪湖の水面を彩る約4万発の花火。', 95),
('隅田川花火大会', '東京都', '墨田区', 35.710600, 139.801400, 'https://www.sumidagawa-hanabi.com', '江戸時代から続く東京最古の花火大会。両国周辺で約2万発。', 97),
('PL花火芸術', '大阪府', '富田林市', 34.483300, 135.598900, null, '約10万発の花火を打ち上げる西日本最大級。PLの塔を中心に圧倒的スケール。', 90),
('なにわ淀川花火大会', '大阪府', '大阪市', 34.694700, 135.486200, 'https://www.yodogawa-hanabi.com', '淀川河川敷で行われる大阪を代表する花火大会。約2万発。', 85),
('土浦全国花火競技大会', '茨城県', '土浦市', 36.080000, 140.204200, 'https://www.tsuchiura-hanabi.com', '大曲と並ぶ全国花火競技大会。霞ヶ浦を背景に約2万発。', 88),
('熊野大花火大会', '三重県', '熊野市', 33.889200, 136.104400, 'https://www.kumano-hanabi.com', '海上自爆や鬼ヶ城大仕掛けなど独自の演目が名物。約1万発。', 82),
('能代役七夕天空の不夜城', '秋田県', '能代市', 40.212500, 140.027800, null, '巨大灯籠と花火が融合した東北を代表する夏祭り。', 75),
('江戸川区花火大会', '東京都', '江戸川区', 35.700600, 139.868100, 'https://www.edogawa-hanabi.com', '都内最大規模の約14000発。市川市と合同開催。', 83);

-- 2025年の年次データ
insert into festival_years (festival_id, year, date, status, fireworks_count, expected_attendance)
select id, 2025,
  case name
    when '大曲の花火' then '2025-08-23'
    when '長岡まつり大花火大会' then '2025-08-02'
    when '諏訪湖祭湖上花火大会' then '2025-08-15'
    when '隅田川花火大会' then '2025-07-26'
    when 'PL花火芸術' then '2025-08-01'
    when 'なにわ淀川花火大会' then '2025-08-09'
    when '土浦全国花火競技大会' then '2025-10-04'
    when '熊野大花火大会' then '2025-08-17'
    when '能代役七夕天空の不夜城' then '2025-08-03'
    when '江戸川区花火大会' then '2025-10-18'
  end::date,
  'scheduled',
  case name
    when '大曲の花火' then 18000
    when '長岡まつり大花火大会' then 20000
    when '諏訪湖祭湖上花火大会' then 40000
    when '隅田川花火大会' then 20000
    when 'PL花火芸術' then 100000
    when 'なにわ淀川花火大会' then 20000
    when '土浦全国花火競技大会' then 20000
    when '熊野大花火大会' then 10000
    when '能代役七夕天空の不夜城' then 5000
    when '江戸川区花火大会' then 14000
  end,
  case name
    when '大曲の花火' then 750000
    when '長岡まつり大花火大会' then 1000000
    when '諏訪湖祭湖上花火大会' then 500000
    when '隅田川花火大会' then 900000
    when 'PL花火芸術' then 1000000
    when 'なにわ淀川花火大会' then 550000
    when '土浦全国花火競技大会' then 800000
    when '熊野大花火大会' then 170000
    when '能代役七夕天空の不夜城' then 120000
    when '江戸川区花火大会' then 1400000
  end
from festivals;
